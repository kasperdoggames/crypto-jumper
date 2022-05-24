const { expect } = require("chai");
const { ethers } = require("hardhat");

const sleep = (milliseconds) => {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
};

describe("P2E", function () {
  it("Should retrieve correct max supply of 1m tokens", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();

    const maxSupply = await gameToken.maxSupply();
    expect(Number(maxSupply)).to.equal(1000000000000000000000000);
  });

  it("Should allow player 1 to mint NFT token", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    const [owner, player1] = await ethers.getSigners();

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    const nftsOwned = await gameNFTToken.walletOfOwner(player1.address);
    expect(nftsOwned.length).to.equal(1);

    const tokensOwned = await gameToken.balanceOf(player1.address);
    expect(tokensOwned).to.equal(ethers.utils.parseEther("10"));
  });

  it("Should get new game identifier", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    const checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    const gameId = await p2eGame.gameId();
    expect(gameId).to.equal(1);
  });

  it("Should perform timed game loop", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    // should transition from begin state to new state
    let checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    let gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);

    await network.provider.send("evm_increaseTime", [30]);
    await network.provider.send("evm_mine");

    const [owner, player1, player2] = await ethers.getSigners();

    await gameNFTToken.pause(false);
    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });
    await p2eGame
      .connect(player2)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    // add some tokens to the player account
    await gameToken.transfer(player1.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player1)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));
    await gameToken.transfer(player2.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player2)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));

    await p2eGame.connect(player1).addPlayerToGameSession("abc");
    await p2eGame.connect(player2).addPlayerToGameSession("def");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(2);

    await network.provider.send("evm_increaseTime", [60]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(3);

    await network.provider.send("evm_increaseTime", [15]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);
  });

  it("Should only allow adding players if state is new game", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    const [owner, player1] = await ethers.getSigners();

    await gameNFTToken.pause(false);

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    await expect(
      p2eGame.connect(player1).addPlayerToGameSession("abc")
    ).to.be.revertedWith("This game session is either running or has finished");
  });

  it("Should allow adding player address to game", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    await p2eGame.performUpkeep([]);
    let gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);

    const [owner, player1] = await ethers.getSigners();

    await gameNFTToken.pause(false);
    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });
    // add some tokens to the player account
    await gameToken.transfer(player1.address, ethers.utils.parseEther("1"));
    const balance = await gameToken.balanceOf(player1.address);
    expect(balance).to.equal(ethers.utils.parseEther("11"));

    await gameToken
      .connect(player1)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));
    const allowance = await gameToken
      .connect(player1)
      .allowance(player1.address, p2eGame.address);
    expect(allowance).to.equal(ethers.utils.parseEther("1"));

    await p2eGame.connect(player1).addPlayerToGameSession("abc");

    let gameSession1 = await p2eGame.getGameSessions(1);
    let numberOfPlayers1 = gameSession1.players.length;
    expect(numberOfPlayers1).to.equal(1);
  });

  it("Should only adding unique player address to game", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    await p2eGame.performUpkeep([]);
    let gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);

    const [owner, player1] = await ethers.getSigners();

    await gameNFTToken.pause(false);

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    // add some tokens to the player account
    await gameToken.transfer(player1.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player1)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));

    await p2eGame.connect(player1).addPlayerToGameSession("abc");
    let gameSession1 = await p2eGame.getGameSessions(1);
    let numberOfPlayers1 = gameSession1.players.length;
    await p2eGame.connect(player1).addPlayerToGameSession("abc");
    let gameSession2 = await p2eGame.getGameSessions(1);
    let numberOfPlayers2 = gameSession2.players.length;

    expect(numberOfPlayers1).to.equal(numberOfPlayers2);
  });

  it("Should reward winning player", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    let gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);

    const [owner, player1, player2] = await ethers.getSigners();

    await gameNFTToken.pause(false);

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    await p2eGame
      .connect(player2)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    // add some tokens to the player account
    await gameToken.transfer(player1.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player1)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));
    await gameToken.transfer(player2.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player2)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));

    await p2eGame.connect(player1).addPlayerToGameSession("abc");
    await p2eGame.connect(player2).addPlayerToGameSession("def");

    await network.provider.send("evm_increaseTime", [30]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(2);

    await p2eGame.playerWon(player1.address, 1);
    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(3);

    const player1Balance = await gameToken.balanceOf(player1.address);
    expect(player1Balance).to.equal(ethers.utils.parseEther("12"));

    const player2Balance = await gameToken.balanceOf(player2.address);
    expect(player2Balance).to.equal(ethers.utils.parseEther("10"));
  });

  it("Should reward contract if no winners", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    let gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);

    const [owner, player1, player2] = await ethers.getSigners();

    await gameNFTToken.pause(false);

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    await p2eGame
      .connect(player2)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    // add some tokens to the player account
    await gameToken.transfer(player1.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player1)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));
    await gameToken.transfer(player2.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player2)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));

    await p2eGame.connect(player1).addPlayerToGameSession("abc");
    await p2eGame.connect(player2).addPlayerToGameSession("def");

    await network.provider.send("evm_increaseTime", [30]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(2);

    await network.provider.send("evm_increaseTime", [60]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(3);

    const player1Balance = await gameToken.balanceOf(player1.address);
    expect(player1Balance).to.equal(ethers.utils.parseEther("10"));

    const player2Balance = await gameToken.balanceOf(player2.address);
    expect(player2Balance).to.equal(ethers.utils.parseEther("10"));

    const contractBalance = await gameToken.balanceOf(p2eGame.address);
    expect(contractBalance).to.equal(ethers.utils.parseEther("982"));
  });

  it("Should finish game early if all players dead", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    let gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);

    const [owner, player1, player2] = await ethers.getSigners();

    await gameNFTToken.pause(false);

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    await p2eGame
      .connect(player2)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    // add some tokens to the player account
    await gameToken.transfer(player1.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player1)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));
    await gameToken.transfer(player2.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player2)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));

    await p2eGame.connect(player1).addPlayerToGameSession("abc");
    await p2eGame.connect(player2).addPlayerToGameSession("def");

    await network.provider.send("evm_increaseTime", [30]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(2);

    await p2eGame.allPlayersLost(1);
    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(3);
  });

  it("Should yield 10 tokens each interval per NFT owned", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    await gameToken.transfer(p2eGame.address, ethers.utils.parseEther("100"));

    const [owner, player1] = await ethers.getSigners();

    await gameNFTToken.pause(false);

    let tokenHolders = await gameNFTToken.getTokenHolders();
    expect(tokenHolders.length).to.equal(0);

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);

    const secondsInHour = 60 * 60;
    await network.provider.send("evm_increaseTime", [secondsInHour]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);

    await network.provider.send("evm_increaseTime", [secondsInHour]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.performUpkeep([]);

    const player1Balance = await gameToken.balanceOf(player1.address);
    expect(player1Balance).to.equal(ethers.utils.parseEther("12"));
  });

  it("Should keep track of token owners", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    const [owner, player1, player2] = await ethers.getSigners();

    await gameNFTToken.pause(false);

    let tokenHolders = await gameNFTToken.getTokenHolders();
    expect(tokenHolders.length).to.equal(0);

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    tokenHolders = await gameNFTToken.getTokenHolders();
    expect(tokenHolders.length).to.equal(1);

    await gameNFTToken
      .connect(player1)
      ["safeTransferFrom(address,address,uint256)"](
        player1.address,
        player1.address,
        1
      );

    tokenHolders = await gameNFTToken.getTokenHolders();
    expect(tokenHolders.length).to.equal(1);

    await gameNFTToken
      .connect(player1)
      ["safeTransferFrom(address,address,uint256)"](
        player1.address,
        player2.address,
        1
      );

    tokenHolders = await gameNFTToken.getTokenHolders();
    expect(tokenHolders.length).to.equal(1);
  });

  it("Should ensure only one NFT per person", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    const [owner, player1] = await ethers.getSigners();

    await gameNFTToken.pause(false);

    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    expect(
      p2eGame
        .connect(player1)
        .mintOne({ value: ethers.utils.parseEther("0.05") })
    ).to.revertedWith("GameNFTToken: Don't be greedy, one NFT per person");
  });

  it("Should allow keeper to perform previously onlyAdmin role", async function () {
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();
    const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
    const gameNFTToken = await GameNFTToken.deploy();
    await gameNFTToken.deployed();
    const P2EGame = await hre.ethers.getContractFactory("P2EGame");
    const p2eGame = await P2EGame.deploy(
      gameToken.address,
      gameNFTToken.address
    );
    await p2eGame.deployed();

    gameToken.transfer(p2eGame.address, ethers.utils.parseEther("1000"));
    gameNFTToken.setP2EGame(p2eGame.address);

    const [owner, player1, player2, keeperAddress] = await ethers.getSigners();

    await p2eGame.setKeeper(keeperAddress.address);

    // should transition from begin state to new state
    let checkUpkeep = await p2eGame.connect(keeperAddress).checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.connect(keeperAddress).performUpkeep([]);
    let gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);

    await network.provider.send("evm_increaseTime", [30]);
    await network.provider.send("evm_mine");

    await gameNFTToken.pause(false);
    await p2eGame
      .connect(player1)
      .mintOne({ value: ethers.utils.parseEther("0.05") });
    await p2eGame
      .connect(player2)
      .mintOne({ value: ethers.utils.parseEther("0.05") });

    // add some tokens to the player account
    await gameToken.transfer(player1.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player1)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));
    await gameToken.transfer(player2.address, ethers.utils.parseEther("1"));
    await gameToken
      .connect(player2)
      .approve(p2eGame.address, ethers.utils.parseEther("1"));

    await p2eGame.connect(player1).addPlayerToGameSession("abc");
    await p2eGame.connect(player2).addPlayerToGameSession("def");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.connect(keeperAddress).performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(2);

    await network.provider.send("evm_increaseTime", [60]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.connect(keeperAddress).performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(3);

    await network.provider.send("evm_increaseTime", [15]);
    await network.provider.send("evm_mine");

    checkUpkeep = await p2eGame.checkUpkeep([]);
    expect(checkUpkeep[0]).to.equal(true);

    await p2eGame.connect(keeperAddress).performUpkeep([]);
    gameSessionState = await p2eGame.gameSessionState();
    expect(gameSessionState).to.equal(1);
  });
});
