import { getGameNFTTokenContract, toIpfsGatewayURL } from "./eth";

export const getNFTTokenMetadata = async (
  ethereum: any,
  walletAddress: string
) => {
  let metadata = null;
  if (walletAddress) {
    console.log("address", walletAddress);
    const gameNFTTokenContract = getGameNFTTokenContract(ethereum);
    if (gameNFTTokenContract) {
      const nftTokens = await gameNFTTokenContract.walletOfOwner(walletAddress);
      if (nftTokens > 0) {
        const tokenId = nftTokens[0];
        const tokenJsonString = await gameNFTTokenContract.tokenURI(tokenId);
        const nftMetadata = toIpfsGatewayURL(tokenJsonString);
        const response = await fetch(nftMetadata);
        metadata = await response.json();
      }
    }
  }

  return metadata;
};
