import express, { Express } from "express";
import next from "next";
import { Server } from "socket.io";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import {
  P2EGAME_CONTRACT_ADDRESS,
  GAMENFTTOKEN_CONTRACT_ADDRESS,
} from "./support/contract_addresses";
import P2EGameJson from "./support/P2EGame.json";
import GameNFTTokenJson from "./support/GameNFTToken.json";
import { BigNumber, BytesLike, ethers } from "ethers";
import forceSsl from "./support/forceSsl";
import { toIpfsGatewayURL } from "./support/eth";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

type Player = {
  playerId: string;
  walletAddress?: string | undefined;
};

interface GameLevelData {
  players: Player[];
  gameState: "waiting" | "running" | "end";
  winner?: Player;
}

interface PlayerUpdateData {
  level: string;
  gameId: string;
  playerData: {
    state: string;
    location: { x: number; y: number };
    flipX: boolean;
  };
}

nextApp.prepare().then(() => {
  const providerUrl =
    "https://polygon-mumbai.g.alchemy.com/v2/A0ILlbpO9xF7SXsx642ICtBfn8hQkZBK";

  const getP2EGameContract = () => {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const SIGNER_WALLET_KEY: BytesLike = process.env.SIGNER_WALLET_KEY || "";
    const signer = new ethers.Wallet(
      new ethers.utils.SigningKey(SIGNER_WALLET_KEY),
      provider
    );
    const p2eGameContract = new ethers.Contract(
      P2EGAME_CONTRACT_ADDRESS,
      P2EGameJson.abi,
      signer
    );
    return p2eGameContract;
  };

  const getGameNFTTokenContract = () => {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const SIGNER_WALLET_KEY: BytesLike = process.env.SIGNER_WALLET_KEY || "";
    const signer = new ethers.Wallet(
      new ethers.utils.SigningKey(SIGNER_WALLET_KEY),
      provider
    );
    const gameNFTTokenContract = new ethers.Contract(
      GAMENFTTOKEN_CONTRACT_ADDRESS,
      GameNFTTokenJson.abi,
      signer
    );
    return gameNFTTokenContract;
  };

  const app: Express = express();
  const server = http.createServer(app);
  const io = new Server(server);
  /*
    {
      "lava": {
        [gameId: string]: {
          players: [socket.id, socket.id],
          gameState: "waiting" | "running" | "end" 
        },
      }
    }
  */

  // contract events

  const gameRooms = new Map<string, Map<string, GameLevelData>>();
  const playersWaiting: Player[] = [];
  const assignedPlayers = new Map<
    string,
    { room: string; walletAddress?: string }
  >();

  const leaderboad = new Map<string, { image: string; count: number }>();

  type GameSates = "Begin" | "New" | "Started" | "Finished";

  const GameSessionStateEnum: {
    [key: number]: GameSates;
  } = {
    0: "Begin",
    1: "New",
    2: "Started",
    3: "Finished",
  };

  let gameState: "Begin" | "New" | "Started" | "Finished";
  let currentGameId: BigNumber;
  let roomSet: string | undefined;
  let lastRoom: string | undefined;

  app.set("port", process.env.PORT || 3000);
  app.use(forceSsl);

  // call contract for state
  const p2eGameContract = getP2EGameContract() as any;

  const resetGame = (levelName: string, oldGameId: string) => {
    const levelData = gameRooms.get(levelName);
    if (!levelData) {
      console.log("no level data");
      return;
    }
    levelData.delete(oldGameId);
    const players = playersWaiting.slice(0, 10).filter((player: Player) => {
      const playerSocket = io.sockets.sockets.get(player.playerId);
      return playerSocket?.connected;
    });
    const gameId = uuidv4();
    const gameData: GameLevelData = {
      players,
      gameState: "waiting",
    };
    levelData.set(gameId, gameData);
    gameRooms.set(levelName, levelData);
  };

  const createLevel = (
    roomRequested: string,
    socketId: string,
    address: string
  ) => {
    const gameId = uuidv4();
    const gameData: GameLevelData = {
      players: [{ playerId: socketId, walletAddress: address }],
      gameState: "waiting",
    };
    const newSlot = new Map<string, GameLevelData>();
    newSlot.set(gameId, gameData);
    gameRooms.set(roomRequested, newSlot);
    assignedPlayers.set(socketId, {
      room: `${roomRequested}_${gameId}`,
      walletAddress: address,
    });
  };

  const getNftImage = async (account: string) => {
    const gameNFTTokenContract = getGameNFTTokenContract();
    if (gameNFTTokenContract) {
      const nftTokens = await gameNFTTokenContract.walletOfOwner(account);
      if (nftTokens > 0) {
        const tokenId = nftTokens[0];
        const tokenJsonString = await gameNFTTokenContract.tokenURI(tokenId);
        const nftMetadata = toIpfsGatewayURL(tokenJsonString);
        const response = await fetch(nftMetadata);
        const imageData = await response.json();
        const image = toIpfsGatewayURL(imageData.image);
        return image;
      }
    }
  };

  const getWinners = async () => {
    if (p2eGameContract) {
      console.log("getWinners!!!!");
      const filterPlayerWon = p2eGameContract.filters.PlayerWon(null);
      const items = await p2eGameContract.queryFilter(
        filterPlayerWon,
        26437334
      );

      const filtered = items.map((item: any) => {
        return { playerAddress: item.args[0] };
      });

      const aggregated = filtered.reduce((acc: any, current: any) => {
        const address = current.playerAddress;
        acc[address] = (acc[address] || 0) + 1;
        return acc;
      }, {});
      for (const item of Object.entries(aggregated)) {
        const image = await getNftImage(item[0]);
        leaderboad.set(item[0], {
          image: image ? image : "",
          count: Number(item[1]),
        });
      }
    }
  };

  if (p2eGameContract) {
    // start listener to contract..

    p2eGameContract.on("NewGame", (gameId: any) => {
      console.log("NewGame received");
      gameState = "New";
      currentGameId = gameId;
      console.log("emitting newgame");
      io.emit("newGame", { gameId, roomSet });
    });

    p2eGameContract.on("GameStarted", (gameId: any) => {
      if (!roomSet) {
        console.log("no room set");
        return;
      }
      gameState = "Started";
      const levelData = gameRooms.get(roomSet);
      if (!levelData || levelData.size === 0) {
        return;
      }
      const lastSlot = Array.from(levelData).pop();

      if (!lastSlot) {
        console.log("no slot found");
        return;
      }

      io.emit("gameData", { gameId: lastSlot[0], ...lastSlot[1], roomSet });
    });

    p2eGameContract.on("GameFinished", async (gameId: any) => {
      gameState = "Finished";
      try {
        if (roomSet) {
          gameRooms.delete(roomSet);
          roomSet = roomSet === "lava" ? "construction" : "lava";
        }
        const leaderBoardData = Array.from(leaderboad).sort(
          ([, a], [, b]) => b.count - a.count
        );
        const top5 = leaderBoardData ? leaderBoardData.slice(0, 5) : [];
        const top5AddressSliced = top5.map((item) => ({
          playerAddress: `${item[0].slice(0, 4)}...${item[0].slice(
            item[0].length - 4,
            item[0].length
          )}`,
          image: item[1].image,
          count: item[1].count,
        }));
        console.log("emitting: ", { leaderBoard: top5AddressSliced });
        io.emit("gameEnd", { leaderBoard: top5AddressSliced });
      } catch (err) {
        console.log(err);
        io.emit("gameEnd", { leaderBoard: [] });
      }
    });

    p2eGameContract.on("GameSettled", (gameId: any) => {});

    p2eGameContract.on(
      "PlayerJoinedGame",
      (address: string, clientId: string) => {
        console.log("PlayerJoinedGame", address, clientId);
        if (!roomSet) {
          console.log("no room set");
          return;
        }

        // find socketid and add account
        // check if socketId is still connected

        const levelData = gameRooms.get(roomSet);
        // if no level, create one and add player to slot 1
        if (!levelData || levelData.size === 0) {
          createLevel(roomSet, clientId, address);
          return;
        }
        // else check player count in last slot
        const lastSlot = Array.from(levelData).pop();
        if (!lastSlot) {
          createLevel(roomSet, clientId, address);
          return;
        }
        lastSlot[1].players = lastSlot[1].players.filter((player) => {
          const playerSocket = io.sockets.sockets.get(player.playerId);
          return playerSocket?.connected;
        });
        if (lastSlot[1].players.length === 0) {
          createLevel(roomSet, clientId, address);
          return;
        }
        if (
          lastSlot[1].players.length >= 10 ||
          lastSlot[1].gameState === "end" ||
          lastSlot[1].gameState === "running"
        ) {
          // add to queue of waiting users
          playersWaiting.push({ playerId: clientId, walletAddress: address });
          return;
        }
        lastSlot[1].players.push({
          walletAddress: address,
          playerId: clientId,
        });
        levelData.set(lastSlot[0], lastSlot[1]);
        gameRooms.set(roomSet, levelData);
        assignedPlayers.set(clientId, {
          room: `${roomSet}_${lastSlot[0]}`,
          walletAddress: address,
        });
      }
    );
  }

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);
    const res: number = await p2eGameContract.gameSessionState();
    const gameId: BigNumber = await p2eGameContract.gameId();
    currentGameId = gameId;
    gameState = GameSessionStateEnum[res];
    if (gameState === "New" && roomSet) {
      socket.emit("newGame", { gameId, roomSet });
    }

    /*
    client provides player update providing the gameId and level name:
      data: {
        level: string,
        gameId: string,
        playerData: {
          state: "run",
          location: this.sprite.body.position,
          flipX: this.sprite.flipX,
        }
      }
    */
    socket.on("playerUpdate", (data: PlayerUpdateData) => {
      // broadcast for all other players listening for that game and instance
      socket.broadcast.emit(`${data.gameId}_player`, {
        playerId: socket.id,
        ...data.playerData,
      });
    });

    /*
      client provides the gameId and level name as well as counter:
      data: {
        level: string,
        gameId: string,
        counter: number
      }
    */
    socket.on(
      "countdown",
      (data: { level: string; gameId: string; counter: number }) => {
        socket.broadcast.emit(`${data.gameId}_countdown`, data.counter);
      }
    );

    /*
      client provides game updates for game state
    */
    socket.on(
      "gameUpdate",
      async (data: {
        level: string;
        gameId: string;
        state: "waiting" | "end" | "running";
        winner?: boolean;
      }) => {
        const levelData = gameRooms.get(data.level);
        if (!levelData) {
          console.log("no level data");
          return;
        }
        const gameData = levelData.get(data.gameId);
        if (!gameData) {
          console.log("no game data");
          return;
        }
        if (data.state === "end") {
          console.log("received game state == end");
          const winner = data.winner ? socket.id : undefined;
          const playerData = assignedPlayers.get(socket.id);
          if (!playerData) {
            console.log("no player data found");
            return;
          }
          const wallet = playerData.walletAddress;
          if (!wallet) {
            console.log("No wallet found");
            return;
          }
          gameData.winner = winner
            ? {
                playerId: winner,
                walletAddress: wallet,
              }
            : undefined;
          gameData.gameState = data.state;
          levelData.set(data.gameId, gameData);
          gameRooms.set(data.level, levelData);
          io.emit(data.gameId, gameData);

          if (gameData.winner) {
            try {
              // add to leaderboard local cache
              const existingLeaderboadPlayerData = leaderboad.get(wallet);
              if (existingLeaderboadPlayerData) {
                leaderboad.set(wallet, {
                  ...existingLeaderboadPlayerData,
                  count: existingLeaderboadPlayerData.count + 1,
                });
              } else {
                const image = await getNftImage(wallet);
                leaderboad.set(wallet, { image: image ? image : "", count: 1 });
              }
              const tx = await p2eGameContract.playerWon(wallet, currentGameId);
              await tx.wait();
            } catch (err) {
              console.log(err);
            }
          } else {
            try {
              const tx = await p2eGameContract.allPlayersLost(currentGameId);
              await tx.wait();
            } catch (err) {
              console.log(err);
            }
          }
          return;
        }
        gameData.gameState = data.state;
        levelData.set(data.gameId, gameData);
        gameRooms.set(data.level, levelData);
      }
    );

    socket.on("dead", () => {
      console.log("a player died", socket.id);
      const game = assignedPlayers.get(socket.id);
      if (!game) {
        return;
      }
      const split = game.room.split("_");
      const [levelName, gameId] = split;
      const level = gameRooms.get(levelName);
      if (!level) {
        return;
      }
      const gameData = level.get(gameId);
      if (!gameData) {
        return;
      }
      console.log("gameData.players: ", gameData.players.length);
      if (gameData.players.length > 1) {
        console.log("emitting dead message");
        io.emit("dead", { id: socket.id });
      }
    });

    socket.on("coinCollected", (id: string) => {
      socket.broadcast.emit("coinCollected", id);
    });

    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
      const game = assignedPlayers.get(socket.id);
      if (!game) {
        return;
      }
      assignedPlayers.delete(socket.id);
      const split = game.room.split("_");
      const [levelName, gameId] = split;
      const level = gameRooms.get(levelName);
      if (!level) {
        return;
      }
      const gameData = level.get(gameId);
      if (!gameData) {
        return;
      }
      console.log("gameData.players: ", gameData.players.length);
      if (gameData.players.length > 1) {
        console.log("emitting dead message");
        io.emit("dead", { id: socket.id });
      } else {
        resetGame(levelName, gameId);
      }
    });
  });

  app.get("/api/currentLevel", (_req, res) => {
    if (roomSet) {
      return res.json({ level: roomSet });
    }
    roomSet = lastRoom === "lava" ? "construction" : "lava";
    lastRoom = roomSet;
    res.json({ level: roomSet });
  });

  app.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(app.get("port"), async () => {
    // get leaderboard data for local cached copy
    await getWinners();
    console.log(`Listening on ${app.get("port")}`);
  });
});
