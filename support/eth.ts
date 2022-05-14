import { ethers } from "ethers";

import GameTokenJson from "./GameToken.json";
import GameNFTTokenJson from "./GameNFTToken.json";
import P2EGameJson from "./P2EGame.json";

import {
  GAMETOKEN_CONTRACT_ADDRESS,
  GAMENFTTOKEN_CONTRACT_ADDRESS,
  P2EGAME_CONTRACT_ADDRESS,
} from "./contract_addresses";

export const getGameTokenContract = (ethereum: any) => {
  if (GameTokenJson.abi) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const gameTokenContract = new ethers.Contract(
      GAMETOKEN_CONTRACT_ADDRESS,
      GameTokenJson.abi,
      signer
    );

    return gameTokenContract;
  }
};

export const getGameNFTTokenContract = (ethereum: any) => {
  if (GameNFTTokenJson.abi) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const gameNFTTokenContract = new ethers.Contract(
      GAMENFTTOKEN_CONTRACT_ADDRESS,
      GameNFTTokenJson.abi,
      signer
    );

    return gameNFTTokenContract;
  }
};

export const getP2EGameContract = (ethereum: any) => {
  if (P2EGameJson.abi) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const p2eGameContract = new ethers.Contract(
      P2EGAME_CONTRACT_ADDRESS,
      P2EGameJson.abi,
      signer
    );

    return p2eGameContract;
  }
};
