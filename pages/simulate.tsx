import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getP2EGameContract, getGameTokenContract } from "../support/eth";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { BaseProvider } from "@ethersproject/providers";
import { GetAccountResult } from "@wagmi/core";
import { P2EGAME_CONTRACT_ADDRESS } from "../support/contract_addresses";

export default function Home() {
  type GameSates = "Begin" | "New" | "Started" | "Finished";

  const GameSessionStateEnum: {
    [key: number]: GameSates;
  } = {
    0: "Begin",
    1: "New",
    2: "Started",
    3: "Finished",
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const { data: account } = useAccount();
  const [cryptAccount, setCryptAccount] =
    useState<GetAccountResult<BaseProvider>>();
  const [gameSessionState, setGameSessionState] = useState<GameSates | null>(
    null
  );
  const [gameTokenBalance, setGameTokenBalance] = useState<number | null>(null);

  const handlePlayerWonEvent = async (address: string, timestamp: number) => {
    console.log("PlayerWonEvent", address, new Date(timestamp).toISOString());
  };

  useEffect(() => {
    if (account) {
      setCryptAccount(account);
    }
  }, [account]);

  useEffect(() => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (!p2eGameContract) {
      return;
    }

    p2eGameContract.on("PlayerWon", (address: string) => {
      handlePlayerWonEvent(address, Date.now());
    });

    p2eGameContract.on("NewGame", () => {
      fetchGameSessionState();
    });

    p2eGameContract.on("GameStarted", () => {
      fetchGameSessionState();
      fetchPlayerTokenBalance();
    });

    p2eGameContract.on("GameFinished", () => {
      fetchGameSessionState();
      fetchPlayerTokenBalance();
    });

    p2eGameContract.on("GameSettled", () => {
      fetchGameSessionState();
    });

    p2eGameContract.on(
      "PlayerJoinedGame",
      (address: string, clientId: string) => {
        console.log("PlayerJoinedGame", address, clientId);
      }
    );

    return () => {
      p2eGameContract.removeAllListeners("PlayerWon");
    };
  }, []);

  const fetchGameSessionState = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      const state: number = await p2eGameContract.gameSessionState();
      setGameSessionState(GameSessionStateEnum[state]);
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

  useEffect(() => {
    fetchGameSessionState();
    fetchPlayerTokenBalance();
  }, []);

  const handleCheckUpkeep = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      console.log("performUpkeep");
      const tx = await p2eGameContract.performUpkeep([]);
      console.log(tx);
      const receipt = await tx.wait();
      console.log(receipt);
      fetchGameSessionState();
    }
  };

  const handleAddPlayer = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract) {
      console.log("addPlayerToGameSession");
      try {
        const clientId = 1; // represents the socket.io client id
        const tx = await p2eGameContract.addPlayerToGameSession(clientId);
        console.log(tx);
        const receipt = await tx.wait();
        console.log(receipt);
        fetchGameSessionState();
      } catch (e) {
        console.log(e);
      }
    }
  };

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
        fetchGameSessionState();
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleStakeFunds = async () => {
    const { ethereum } = window;
    const gameTokenContract = getGameTokenContract(ethereum);
    if (gameTokenContract) {
      console.log("approve");
      try {
        const tx = await gameTokenContract.approve(
          P2EGAME_CONTRACT_ADDRESS,
          ethers.utils.parseEther("10")
        );
        console.log(tx);
        const receipt = await tx.wait();
        console.log(receipt);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handlePlayerWon = async () => {
    const { ethereum } = window;
    const p2eGameContract = getP2EGameContract(ethereum);
    if (p2eGameContract && inputRef.current) {
      const playerAddress = inputRef.current.value.trim();
      if (playerAddress) {
        console.log("playerWon: ", playerAddress);
        try {
          const tx = await p2eGameContract.playerWon(playerAddress);
          console.log(tx);
          const receipt = await tx.wait();
          console.log(receipt);
        } catch (e) {
          console.log(e);
        }
      }
    }
  };

  return (
    <div className="">
      <Head>
        <title>CryptoJumper Testing</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex justify-center items-center flex-col h-screen space-y-5">
        <ConnectButton />
        {/* {account && ( */}
        <div className="flex justify-center items-center flex-col space-y-5">
          <div>STATES: BEGIN : NEW : STARTED : FINISHED : NEW etc.</div>
          <div className="flex space-x-1">
            <div>Token Balance:</div>
            <div>{gameTokenBalance}</div>
          </div>
          <div className="text-xl font-bold">
            Game Session State: {gameSessionState}
          </div>
          <button
            className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
            onClick={handleMintNFT}
          >
            Mint NFT
          </button>
          <button
            className="px-4 py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-400"
            onClick={handleCheckUpkeep}
          >
            Check Upkeep
          </button>
          <button
            className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
            onClick={handleStakeFunds}
          >
            Stake Funds
          </button>
          <button
            className="px-4 py-4 font-bold text-white bg-green-600 rounded-xl hover:bg-green-100 hover:text-green-400"
            onClick={handleAddPlayer}
          >
            Add Player
          </button>
          <div className="flex space-x-2">
            <div className="font-bold ">Winning Player Address:</div>
            <input className="border-2" ref={inputRef} type="text"></input>
          </div>
          <button
            className="px-4 py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-400"
            onClick={handlePlayerWon}
          >
            Player Won
          </button>
        </div>
        {/* )} */}
      </main>
    </div>
  );
}
