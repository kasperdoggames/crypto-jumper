// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameToken.sol";

contract GameNFTToken is ERC721Enumerable, Ownable {
  using Strings for uint256;

  address private admin;
  address private p2eGame;
  string baseURI;
  string public baseExtension = ".json";
  uint256 public cost = 0.05 ether;
  uint256 public maxSupply = 10000;
  uint256 public maxMintAmount = 20;
  bool public paused = false;
  bool public revealed = false;
  string public notRevealedUri;

  address[] public tokenHolders =  new address[](0);

  constructor() ERC721("CoolLink", "COOLLINK") {
    admin = msg.sender;
    setBaseURI("ipfs://");
    setNotRevealedURI("ipfs://");
  }

  // internal
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  modifier onlyAdmin() {
    require(msg.sender == admin, "GameNFTToken: Admin can perform this operation.");
    _;
  }

  modifier onlyAdminOrP2EGame() {
    require(msg.sender == p2eGame || msg.sender == admin, "GameNFTToken: Admin or P2EGame can perform this operation.");
    _;
  }

  function setP2EGame(address _p2eGame) public onlyAdmin {
    p2eGame = _p2eGame;
  }

  // public
  function mint(uint256 _mintAmount) public onlyAdmin {
    uint256 supply = totalSupply();
    require(!paused, "GameNFTToken: Minting paused");
    require(_mintAmount > 0, "GameNFTToken: No point minting zero");
    require(_mintAmount <= maxMintAmount, "GameNFTToken: You can't mint that many in one go");
    require(supply + _mintAmount <= maxSupply, "GameNFTToken: Not enough left for you to mint that many");

    for (uint256 i = 1; i <= _mintAmount; i++) {
      _safeMint(msg.sender, supply + i);
    }
  }

  function mintOne(address playerAddress) public onlyAdminOrP2EGame {
    uint256 supply = totalSupply();
    require(!paused, "GameNFTToken: Minting paused");
    require(supply + 1 <= maxSupply, "GameNFTToken: No more left to mint");
    require(walletOfOwner(playerAddress).length == 0, "GameNFTToken: Don't be greedy, one NFT per person");

    // if (msg.sender != owner()) {
    //   require(msg.value >= cost, "GameNFTToken: Minting doesn't come free you know");
    // }

    _safeMint(playerAddress, supply + 1);
  }

  function walletOfOwner(address _owner)
    public
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory tokenIds = new uint256[](ownerTokenCount);
    for (uint256 i; i < ownerTokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokenIds;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );
    
    if(revealed == false) {
        return notRevealedUri;
    }

    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
        : "";
  }

  //only owner
  function reveal() public onlyAdmin {
      revealed = true;
  }
  
  function setCost(uint256 _newCost) public onlyAdmin {
    cost = _newCost;
  }

  function setmaxMintAmount(uint256 _newmaxMintAmount) public onlyAdmin {
    maxMintAmount = _newmaxMintAmount;
  }
  
  function setNotRevealedURI(string memory _notRevealedURI) public onlyAdmin {
    notRevealedUri = _notRevealedURI;
  }

  function setBaseURI(string memory _newBaseURI) public onlyAdmin {
    baseURI = _newBaseURI;
  }

  function setBaseExtension(string memory _newBaseExtension) public onlyAdmin {
    baseExtension = _newBaseExtension;
  }

  function pause(bool _state) public onlyAdmin {
    paused = _state;
  }
 
  function withdraw() public payable onlyAdmin {
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
  }

  function removeFromTokenHolders(address from) internal {
      if (tokenHolders.length > 0) {
        bool isFound = false;
        
        if (tokenHolders[tokenHolders.length - 1] == from){
            isFound = true;
        }
        else {
            for (uint i = 0; i < tokenHolders.length - 1; i++) {
                if (!isFound && tokenHolders[i] == from) {
                    isFound = true;
                }

                if (isFound) {
                    tokenHolders[i] = tokenHolders[i + 1];
                }
            }
        }

        if (isFound){
            delete tokenHolders[tokenHolders.length - 1];
            tokenHolders.pop();
        }
      }
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
    super._beforeTokenTransfer(from, to, tokenId);
    // ignore transfers to same address
    if (from != to) {
      removeFromTokenHolders(from);
      tokenHolders.push(to);
    }
  }

  function getTokenHolders() public view  returns (address[] memory) {
    return tokenHolders;
  }
}