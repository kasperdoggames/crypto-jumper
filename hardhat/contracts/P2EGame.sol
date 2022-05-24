// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./GameToken.sol";
import "./GameNFTToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

contract P2EGame is Ownable, KeeperCompatibleInterface {
    // admin address
    address private admin;
    address private keeper;
    // this is the erc20 GameToken contract address
    address public tokenAddress; 
    address public nftAddress; 
    uint256 public gameId;
    uint256 public lastTimestamp = 0;
    uint256 public lastYieldTimestamp = 0;
    uint256 constant public gameLengthSeconds = 60; // 1 minute
    uint256 constant public inLobbySeconds = 30;
    uint256 constant public showScoresSeconds = 15;
    uint256 constant secondsInHour = 3600;
    uint256 constant mintingYield = 10;

    struct GameSession {
        address[] players;
        address winner;
        bool allPlayersLost;
    }

    enum  GameSessionState {
        Begin,
        New,
        Started,
        Finished
    }

    GameSessionState public gameSessionState;

    // map game to game sessions
    mapping(uint256 => GameSession) gameSessions;

    // set-up event for emitting once character minted to read out values
    event NewGame(uint256 id);
    event GameStarted(uint256 id);
    event GameFinished(uint256 id);
    event GameSettled(uint256 id);
    event PlayerJoinedGame(address playerAddress, string clientId);
    event PlayerWon(address playerAddress);
    event AllPlayersLost(uint256 id);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "P2EGame: Admin can perform this operation.");
        _;
    }

    modifier onlyAdminOrKeeper() {
        require(msg.sender == keeper || msg.sender == admin, "P2EGame: Admin or Keeper can perform this operation.");
        _;
    }

    constructor(address _tokenAddress, address _nftAddress) {
        tokenAddress = _tokenAddress;
        nftAddress = _nftAddress;
        admin = msg.sender;
        gameId = 0;
        gameSessionState = GameSessionState.Begin;
        lastYieldTimestamp = block.timestamp;
    }

    function mintOne() public payable {
        GameNFTToken gameNFTToken = GameNFTToken(nftAddress);
        gameNFTToken.mintOne(msg.sender);

        GameToken gameToken = GameToken(tokenAddress);
        gameToken.transfer(msg.sender, mintingYield * gameToken.unit());
    }

    function setKeeper(address _keeper) public onlyAdmin {
        keeper = _keeper;
    }

    function getGameSessions(uint256 _gameId) public view returns (GameSession memory) {
        return gameSessions[_gameId];
    }

    function isEnoughPlayers() internal view returns (bool) {
        // Need atleast 2 players
        return gameSessions[gameId].players.length >= 2;
    }

    function hasPlayerWon() internal view returns (bool) {
        // Need to check if there is a winning player for game session with gameId
        return gameSessions[gameId].winner != address(0);
    }

    function haveAllPlayersLost() internal view returns (bool) {
        // Need to check if there is a winning player for game session with gameId
        return gameSessions[gameId].allPlayersLost;
    }

    function isIntervalOverSeconds(uint256 _seconds) internal view returns (bool) {
        return block.timestamp - lastTimestamp >= _seconds;
    }

    function yieldTokensToNFTHolders() internal {
        GameToken gameToken = GameToken(tokenAddress);
        GameNFTToken nftToken = GameNFTToken(nftAddress);
        address[] memory nftTokenHolders = nftToken.getTokenHolders();
        for (uint i = 0; i < nftTokenHolders.length; i++) {
            gameToken.transfer(nftTokenHolders[i], 1 * gameToken.unit());
        }
    }

    function performUpkeep(bytes calldata) external override {
        uint256 blockTimestamp = block.timestamp;

        if (block.timestamp > lastYieldTimestamp + secondsInHour) {
            lastYieldTimestamp = blockTimestamp - (blockTimestamp % secondsInHour);
            yieldTokensToNFTHolders();
        }

        if (gameSessionState == GameSessionState.Begin) {
            createGame();
            lastTimestamp = blockTimestamp;
            gameSessionState = GameSessionState.New;
            emit NewGame(gameId);
        }
        else if (gameSessionState == GameSessionState.New) {
            if (isIntervalOverSeconds(inLobbySeconds) && isEnoughPlayers()) {
                startGame();
                lastTimestamp = blockTimestamp;
                gameSessionState = GameSessionState.Started;   
                emit GameStarted(gameId);         
            }
        }
        else if (gameSessionState == GameSessionState.Started) {
            if (isIntervalOverSeconds(gameLengthSeconds) || hasPlayerWon() || haveAllPlayersLost()) {
                settleGame();
                lastTimestamp = blockTimestamp;
                gameSessionState = GameSessionState.Finished;
                emit GameFinished(gameId);  
            }            
        }
        else if (gameSessionState == GameSessionState.Finished) {
            if (isIntervalOverSeconds(showScoresSeconds)) {
                createGame();
                lastTimestamp = blockTimestamp;
                gameSessionState = GameSessionState.New;
                emit NewGame(gameId);
            }            
        }
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {

        // We yield 10 tokens for each day of NFT token ownership
        if (block.timestamp > lastYieldTimestamp + secondsInHour) {
            return (true, bytes(""));
        }

        if (gameSessionState == GameSessionState.Begin) {
            return (true, bytes(""));
        }
        else if (gameSessionState == GameSessionState.New) {
            if (isIntervalOverSeconds(inLobbySeconds) && isEnoughPlayers()) {
                return (true, bytes(""));
            }
        }
        else if (gameSessionState == GameSessionState.Started) {
            if (isIntervalOverSeconds(gameLengthSeconds) || hasPlayerWon() || haveAllPlayersLost()) {
                return (true, bytes(""));
            }            
        }
        else if (gameSessionState == GameSessionState.Finished) {
            if (isIntervalOverSeconds(showScoresSeconds)) {
                return (true, bytes(""));
            }            
        }

        return (false, bytes(""));
    }

    function createGame(
    ) internal onlyAdminOrKeeper {
        gameId++;
        GameSession memory gs = GameSession(new address[](0), address(0), false);
        gameSessions[gameId] = gs;
    }

    function startGame(
    ) internal onlyAdminOrKeeper {

        // transfer 1 token for game stake from each player to escrow (this contract)
        GameToken gameToken = GameToken(tokenAddress);
        address[] memory players = gameSessions[gameId].players;

        for(uint256 i = 0; i < players.length; i++){
            gameToken.transferFrom(players[i], address(this), 1 * gameToken.unit());
        }
    }

    function settleGame() internal onlyAdminOrKeeper {
        if (hasPlayerWon()) {
            GameToken gameToken = GameToken(tokenAddress);
            address[] memory players = gameSessions[gameId].players;
            uint256 numberOfPlayers = players.length;
            address winningPlayerAddress = gameSessions[gameId].winner;
            // reward player with all of the player tokens (numberOfPlayers - 1) + their stake +1 = numberOfPlayer
            uint256 winningAmount = numberOfPlayers * gameToken.unit();
            gameToken.transfer(winningPlayerAddress, winningAmount);
            emit GameSettled(gameId);
        }
    }

    function addPlayerToGameSession(string memory clientId) public {
        // TODO: Ensure player is owner of a game NFT
        GameNFTToken nftToken = GameNFTToken(nftAddress);
        require(nftToken.balanceOf(msg.sender) > 0, "P2EGame: Must be NFT owner to play");
        
        // Ensure game session for gameId is still open for new players
        require(gameSessionState == GameSessionState.New, "P2EGame: This game session is either running or has finished");

        // add player to game session - avoiding duplicate entries
        address[] memory players = gameSessions[gameId].players;

        bool isExisting = false;
        for(uint256 i = 0; i < players.length; i++){
            if(msg.sender == players[i]){
                isExisting = true;
            }
        }
        if(!isExisting){
            gameSessions[gameId].players.push(msg.sender);
            emit PlayerJoinedGame(msg.sender, clientId);
        }
    }

    // admin unlocks tokens in escrow once game's outcome decided
    function playerWon(address _player, uint256 _gameId)
        external
        onlyAdminOrKeeper
    {
        if (_gameId == gameId) {
            gameSessions[gameId].winner = _player;
            emit PlayerWon(_player);
        }
    }

    // admin unlocks tokens in escrow once game's outcome decided
    function allPlayersLost(uint256 _gameId)
        external
        onlyAdminOrKeeper
    {
        if (_gameId == gameId) {
            gameSessions[gameId].allPlayersLost = true;
            emit AllPlayersLost(gameId);
        }
    }
}