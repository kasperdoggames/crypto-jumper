import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useNetwork } from "wagmi";
import { useEffect, useState } from "react";
import { BaseProvider } from "@ethersproject/providers";
import { GetAccountResult } from "@wagmi/core";
import { getGameNFTTokenContract, getP2EGameContract } from "../support/eth";
import { ethers } from "ethers";

const Home: NextPage = () => {
  const [cryptAccount, setCryptAccount] =
    useState<GetAccountResult<BaseProvider>>();

  const { data: account } = useAccount();
  const { activeChain } = useNetwork();
  const [hasNFT, setHasNFT] = useState(false);

  useEffect(() => {
    if (account) {
      setCryptAccount(account);
    }
  }, [account]);

  useEffect(() => {
    checkNFT();
  }, [cryptAccount]);

  // Dynamic Loader to wait before loaing up the phaser game
  const DynamicLoader = dynamic(() => import("../components/GameManager"), {
    loading: () => <p>Loading...</p>,
    ssr: false,
  });

  const handleMintNFT = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      console.log("mintOne");
      try {
        const tx = await p2eGameContract.mintOne({
          value: ethers.utils.parseEther("0.05"),
        });
        console.log(tx);
        const receipt = await tx.wait();
        console.log(receipt);
        setHasNFT(true);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const checkNFT = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      return;
    }
    const contract = getGameNFTTokenContract(ethereum);
    if (contract && cryptAccount?.address) {
      const tokenCount = await contract.balanceOf(cryptAccount.address);
      if (tokenCount > 0) {
        setHasNFT(true);
      }
    }
  };

  // todo check claims
  return (
    <div>
      <Head>
        <title>Crypto Jumper</title>
      </Head>
      <div className="flex flex-col items-center bg-blue-900 h-screen">
        <ConnectButton />
        {cryptAccount && !activeChain?.unsupported ? (
          <div>
            {!hasNFT ? (
              <button
                className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
                onClick={handleMintNFT}
              >
                Mint NFT
              </button>
            ) : (
              <>
                <div id="game"></div>
                <DynamicLoader />
              </>
            )}
          </div>
        ) : (
          <div>
            <img src="/assets/logo.png"></img>
            <p>Please Connect to Play</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
