import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useAccount, useNetwork } from "wagmi";
import { useEffect, useState } from "react";
import { BaseProvider } from "@ethersproject/providers";
import { GetAccountResult } from "@wagmi/core";
import {
  getGameNFTTokenContract,
  getP2EGameContract,
  getGameTokenContract,
} from "../../support/eth";
import { ethers } from "ethers";
import Navbar from "../../components/Navbar";
import LoadingScreen from "../../components/Loading";
import { P2EGAME_CONTRACT_ADDRESS } from "../../support/contract_addresses";

const Home: NextPage = () => {
  const [cryptAccount, setCryptAccount] =
    useState<GetAccountResult<BaseProvider>>();

  const { data: account } = useAccount();
  const { activeChain } = useNetwork();
  const [hasNFT, setHasNFT] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gameTokenBalance, setGameTokenBalance] = useState<number | null>(null);
  const [gameAllowance, setGameAllowance] = useState<number | null>(null);
  const [tokensStaked, setTokensStaked] = useState(0);

  useEffect(() => {
    if (account) {
      setCryptAccount(account);
    }
  }, [account]);

  useEffect(() => {
    init();
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
    setIsLoading(true);
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
        setIsLoading(false);
      } catch (e) {
        setIsLoading(false);
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
      try {
        const tokenCount = await contract.balanceOf(cryptAccount.address);
        if (tokenCount.toNumber() > 0) {
          setHasNFT(true);
        }
      } catch (err) {
        console.log("error on balanceOf: ", err);
      }
    }
  };

  const fetchPlayerTokenBalance = async () => {
    const { ethereum } = window;
    const gameTokenContract = getGameTokenContract(ethereum);
    if (gameTokenContract && cryptAccount) {
      const balance = await gameTokenContract.balanceOf(cryptAccount.address);
      let res = Number(ethers.utils.formatUnits(balance, 18));
      res = Math.round(res * 1e4) / 1e4;
      setGameTokenBalance(res);
    }
  };

  const fetchPlayerTokenAllowance = async () => {
    const { ethereum } = window;
    const gameTokenContract = getGameTokenContract(ethereum);
    if (gameTokenContract && cryptAccount) {
      const allowance = await gameTokenContract.allowance(
        cryptAccount.address,
        P2EGAME_CONTRACT_ADDRESS
      );
      let res = Number(ethers.utils.formatUnits(allowance, 18));
      res = Math.round(res * 1e4) / 1e4;
      console.log("gameAllowance: ", res);
      setGameAllowance(res);
    }
  };

  const init = async () => {
    setIsLoading(true);
    await checkNFT();
    await fetchPlayerTokenBalance();
    await fetchPlayerTokenAllowance();
    setIsLoading(false);
  };

  const handleStakeFunds = async () => {
    const { ethereum } = window;
    const gameTokenContract = getGameTokenContract(ethereum);
    if (gameTokenContract) {
      console.log("approve");
      try {
        setIsLoading(true);
        const tx = await gameTokenContract.approve(
          P2EGAME_CONTRACT_ADDRESS,
          ethers.utils.parseEther(tokensStaked.toString())
        );
        console.log(tx);
        const receipt = await tx.wait();
        console.log(receipt);
        setGameAllowance(tokensStaked);
        setIsLoading(false);
      } catch (e) {
        console.log(e);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-gray-900">
      {/* https://stackoverflow.com/questions/51217147/how-to-use-a-local-font-in-phaser-3 */}
      <div
        style={{
          fontFamily: "Splatch",
          position: "absolute",
          left: "-1000px",
          visibility: "hidden",
        }}
      >
        .
      </div>
      <div className="container h-full mx-auto max-w-7xl">
        <div>
          <Head>
            <title>Crypto Jumper</title>
            <link
              rel="preload"
              as="font"
              href="/fonts/Splatch.ttf"
              type="font/ttf"
            />
          </Head>
          <Navbar currentPageHref="game" />
          <div className="flex flex-col items-center h-screen bg-gray-700">
            <LoadingScreen isLoading={isLoading} />
            {cryptAccount && !activeChain?.unsupported ? (
              <div>
                {!hasNFT ? (
                  <button
                    className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
                    onClick={handleMintNFT}
                  >
                    Mint NFT
                  </button>
                ) : !gameAllowance || gameAllowance <= 0 ? (
                  <div className="text-center items-center">
                    <p className="pt-2 text-xl text-white font-splatch">
                      Stake tokens to play the game
                    </p>

                    <div className="flex flex-row w-full h-10 mt-4 bg-transparent rounded-lg">
                      <button
                        type="button"
                        className="w-20 h-full text-gray-600 bg-gray-300 rounded-none rounded-l cursor-pointer focus:outline-none hover:text-gray-900"
                        onClick={() => {
                          const updatedTokensStaked = tokensStaked - 1;
                          setTokensStaked(
                            updatedTokensStaked < 0 ? 0 : updatedTokensStaked
                          );
                        }}
                      >
                        <span className="block pb-1 m-auto text-2xl">−</span>
                      </button>
                      <input
                        id="custom-input-number"
                        type="number"
                        className="flex items-center w-full font-semibold text-center text-gray-900 bg-gray-300 rounded-none outline-none focus:outline-none text-md md:text-basecursor-default"
                        name="custom-input-number"
                        value={tokensStaked}
                        readOnly
                      ></input>
                      <button
                        className="w-20 h-full text-gray-600 bg-gray-300 rounded-none rounded-r cursor-pointer focus:outline-none hover:text-gray-900"
                        type="button"
                        onClick={() => {
                          if (!gameTokenBalance) {
                            setTokensStaked(0);
                            return;
                          }
                          const updatedTokensStaked = tokensStaked + 1;
                          setTokensStaked(
                            updatedTokensStaked > gameTokenBalance
                              ? gameTokenBalance
                              : updatedTokensStaked
                          );
                        }}
                      >
                        <span className="block pb-1 m-auto text-2xl">+</span>
                      </button>
                    </div>
                    <button
                      className="px-4 py-4 mt-2 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
                      onClick={handleStakeFunds}
                    >
                      Stake Funds
                    </button>
                  </div>
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
