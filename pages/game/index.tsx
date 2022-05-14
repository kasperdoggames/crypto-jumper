import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useAccount, useNetwork } from "wagmi";
import { useEffect, useState } from "react";
import { BaseProvider } from "@ethersproject/providers";
import { GetAccountResult } from "@wagmi/core";
import { getGameNFTTokenContract, getP2EGameContract } from "../../support/eth";
import { ethers } from "ethers";
import Navbar from "../../components/Navbar";

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
  const DynamicLoader = dynamic(
    () => import("../../components/gameComponents/GameManager"),
    {
      loading: () => <p>Loading...</p>,
      ssr: false,
    }
  );

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
    <div className="bg-gray-900">
      <div className="container h-full mx-auto max-w-7xl">
        <div>
          <Head>
            <title>Crypto Jumper</title>
          </Head>
          <Navbar currentPageHref="game" />
          <div className="flex flex-col items-center h-screen bg-gray-700">
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
              <div className="flex flex-col items-center">
                <p className="pt-2 text-xl text-white font-splatch">
                  Connect wallet to play
                </p>
                <img src="/assets/logo.png"></img>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
