import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useAccount, useNetwork } from "wagmi";
import { Fragment, useEffect, useState } from "react";
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
import { Dialog, Transition } from "@headlessui/react";

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
  const [open, setOpen] = useState(false);

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
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative px-4 pt-5 pb-4 overflow-hidden text-left transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-sm sm:w-full sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="pb-3 font-medium leading-6 text-gray-900 font-splatch"
                      >
                        Choose how much to stake!
                      </Dialog.Title>
                      <div className="mt-2">
                        <div className="flex flex-row w-full mt-4 bg-transparent rounded-lg h-14">
                          <button
                            type="button"
                            className="w-20 h-full text-gray-600 bg-gray-300 rounded-none rounded-l cursor-pointer font-splatch focus:outline-none hover:text-gray-900"
                            onClick={() => {
                              const updatedTokensStaked = tokensStaked - 1;
                              setTokensStaked(
                                updatedTokensStaked < 0
                                  ? 0
                                  : updatedTokensStaked
                              );
                            }}
                          >
                            <span className="block pb-3 m-auto text-3xl">
                              −
                            </span>
                          </button>
                          <input
                            id="custom-input-number"
                            type="number"
                            className="flex items-center w-full font-semibold text-center text-gray-900 bg-gray-300 rounded-none outline-none font-splatch focus:outline-none text-md md:text-basecursor-default"
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
                            <span className="block pb-1 m-auto text-3xl">
                              +
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center w-full px-4 py-4 text-base font-medium text-white bg-yellow-600 border border-transparent rounded-md shadow-sm font-splatch hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:text-sm"
                      onClick={() => {
                        setOpen(false);
                        handleStakeFunds();
                      }}
                    >
                      Stake $COOL
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

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
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-2/3 space-y-8 text-center">
                      <div className="text-2xl text-white font-splatch">
                        You&apos;re going to need an NFT!
                      </div>
                      <div className="text-center text-white font-splatch">
                        Create your own unique Coollink NFT to own, cherish and
                        most importantly your ticket to play the game.
                      </div>
                      <button
                        className="px-12 pt-4 pb-6 border-4 border-white drp drop-shadow-2xl shadow-white bg-violet-600 rounded-xl hover:bg-violet-500"
                        onClick={handleMintNFT}
                      >
                        <img
                          className="pb-4"
                          src="/assets/coollink_avatar.png"
                          alt="Coollink Avatar"
                        />
                        <div className="text-lg font-bold text-white font-splatch">
                          Mint NFT
                        </div>
                      </button>
                    </div>
                  </div>
                ) : !gameAllowance || gameAllowance <= 0 ? (
                  <div>
                    <div className="flex flex-col items-center py-8">
                      <div className="flex flex-col items-center w-2/3 space-y-8 text-center">
                        <div className="text-2xl text-white font-splatch">
                          Stake your $COOL
                        </div>
                        <div className="text-center text-white font-splatch">
                          You&apos;ll need to stake some of your $COOL tokens to
                          play the game.
                        </div>
                        <button
                          className="flex flex-col items-center px-12 pt-4 pb-6 bg-yellow-600 border-4 border-white drop-shadow-2xl hover:bg-yellow-500 rounded-xl shadow-white"
                          onClick={() => setOpen(true)}
                        >
                          <img
                            className="pb-4"
                            src="/assets/cool_token.png"
                            alt="Cool Token"
                          />
                          <div className="text-lg font-bold text-white font-splatch">
                            Stake $COOL
                          </div>
                        </button>
                      </div>
                    </div>
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
