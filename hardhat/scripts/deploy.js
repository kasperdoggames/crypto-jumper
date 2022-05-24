const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const GameToken = await hre.ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.deployed();

  console.log(`---------------------`);
  console.log("GameToken deployed to:", gameToken.address);
  console.log(`---------------------`);

  const GameNFTToken = await hre.ethers.getContractFactory("GameNFTToken");
  const gameNFTToken = await GameNFTToken.deploy();
  await gameNFTToken.deployed();

  console.log(`---------------------`);
  console.log("GameNFTToken deployed to:", gameNFTToken.address);
  console.log(`---------------------`);

  const P2EGame = await hre.ethers.getContractFactory("P2EGame");
  const p2eGame = await P2EGame.deploy(gameToken.address, gameNFTToken.address);
  await p2eGame.deployed();

  console.log(`---------------------`);
  console.log("P2EGame deployed to:", p2eGame.address);
  console.log(`---------------------`);

  // set the Keeper contract address on Polygon Mumbai
  await p2eGame.setKeeper("0x6179B349067af80D0c171f43E6d767E4A00775Cd");

  // load the P2EGame contract with funds
  const tx = await gameToken.transfer(
    p2eGame.address,
    ethers.utils.parseEther("1000")
  );
  await tx.wait();

  const balance = await gameToken.balanceOf(p2eGame.address);

  await gameNFTToken.setP2EGame(p2eGame.address);

  // tell GameNFTToken contract the P2EGame contract address
  gameNFTToken.setP2EGame(p2eGame.address);

  console.log(`---------------------`);
  console.log("P2EGame contract balance: ", Number(balance));
  console.log(`---------------------`);

  const config = `export const GAMETOKEN_CONTRACT_ADDRESS = "${gameToken.address}";
export const GAMENFTTOKEN_CONTRACT_ADDRESS = "${gameNFTToken.address}";
export const P2EGAME_CONTRACT_ADDRESS = "${p2eGame.address}";
    `;

  fs.writeFileSync(
    path.join(__dirname, "../../support/contract_addresses.js"),
    config
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
