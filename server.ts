import express, { Express } from "express";
import next from "next";
import { Server } from "socket.io";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import { P2EGAME_CONTRACT_ADDRESS } from "./support/contract_addresses";
import P2EGameJson from "./support/P2EGame.json";
import { BytesLike, ethers } from "ethers";
import forceSsl from "./support/forceSsl";

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
  const getP2EGameContract = () => {
    const provider = new ethers.providers.JsonRpcProvider(
      "https://polygon-mumbai.g.alchemy.com/v2/A0ILlbpO9xF7SXsx642ICtBfn8hQkZBK"
    );
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

  const getWinners = async () => {
    if (p2eGameContract) {
      const filterPlayerWon = p2eGameContract.filters.PlayerWon(null);
      const items = await p2eGameContract.queryFilter(
        filterPlayerWon,
        26355256
      );

      const filtered = items.map((item: any) => {
        return { playerAddress: item.args[0] };
      });

      const aggregated = filtered.reduce((acc: any, current: any) => {
        const address = current.playerAddress;
        acc[address] = (acc[address] || 0) + 1;
        return acc;
      }, {});

      const sorted = Object.entries(aggregated).sort(
        ([, a]: any, [, b]: any) => b - a
      );

      return sorted.map((item) => ({ playerAddress: item[0], count: item[1] }));
    }
  };

  if (p2eGameContract) {
    // start listener to contract..

    p2eGameContract.on("NewGame", (gameId: any) => {
      console.log("NewGame received");
      gameState = "New";
      console.log("emitting newgame");
      io.emit("newGame", { gameId });
    });

    p2eGameContract.on("GameStarted", (gameId: any) => {
      gameState = "Started";
      const roomRequested = "lava";
      const levelData = gameRooms.get(roomRequested);
      if (!levelData || levelData.size === 0) {
        return;
      }
      const lastSlot = Array.from(levelData).pop();

      if (!lastSlot) {
        console.log("no slot found");
        return;
      }

      io.emit("gameData", { gameId: lastSlot[0], ...lastSlot[1] });
      // broadcast for any other players on same channel
      // io.emit(`${roomRequested}_${lastSlot[0]}`, lastSlot[1]);
    });

    p2eGameContract.on("GameFinished", async (gameId: any) => {
      gameState = "Finished";
      try {
        const levelData = gameRooms.get("lava");
        if (levelData) {
          // clear all level data
          levelData.clear();
          const gameId = uuidv4();
          const gameData: GameLevelData = {
            players: [],
            gameState: "waiting",
          };
          levelData.set(gameId, gameData);
          gameRooms.set("lava", levelData);
          assignedPlayers.clear();
        }
        const leaderBoardData = await getWinners();
        const top5 = leaderBoardData ? leaderBoardData.slice(0, 5) : [];
        const top5AddressSliced = top5.map((item) => ({
          playerAddress: `${item.playerAddress.slice(
            0,
            4
          )}...${item.playerAddress.slice(
            item.playerAddress.length - 4,
            item.playerAddress.length
          )}`,
          count: item.count,
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

        // find socketid and add account
        // check if socketId is still connected

        const roomRequested = "lava";
        const levelData = gameRooms.get(roomRequested);
        // if no level, create one and add player to slot 1
        if (!levelData || levelData.size === 0) {
          createLevel(roomRequested, clientId, address);
          return;
        }
        // else check player count in last slot
        const lastSlot = Array.from(levelData).pop();
        if (!lastSlot) {
          createLevel(roomRequested, clientId, address);
          return;
        }
        lastSlot[1].players = lastSlot[1].players.filter((player) => {
          const playerSocket = io.sockets.sockets.get(player.playerId);
          return playerSocket?.connected;
        });
        if (lastSlot[1].players.length === 0) {
          createLevel(roomRequested, clientId, address);
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
        gameRooms.set(roomRequested, levelData);
        assignedPlayers.set(clientId, {
          room: `${roomRequested}_${lastSlot[0]}`,
          walletAddress: address,
        });
      }
    );
  }

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);
    const res: number = await p2eGameContract.gameSessionState();
    gameState = GameSessionStateEnum[res];
    console.log({ gameState });
    if (gameState === "New") {
      socket.emit("newGame");
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
      socket.broadcast.emit(`${data.level}_${data.gameId}_player`, {
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
        socket.broadcast.emit(
          `${data.level}_${data.gameId}_countdown`,
          data.counter
        );
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
      }) => {
        const levelData = gameRooms.get(data.level);
        if (!levelData) {
          return;
        }
        const gameData = levelData.get(data.gameId);
        if (!gameData) {
          return;
        }
        if (data.state === "end") {
          console.log("a player has won - game state == end");
          const winner = socket.id;
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
          gameData.winner = {
            playerId: winner,
            walletAddress: wallet,
          };
          gameData.gameState = data.state;
          levelData.set(data.gameId, gameData);
          gameRooms.set(data.level, levelData);
          io.emit(`lava_${data.gameId}`, gameData);

          try {
            const tx = await p2eGameContract.playerWon(wallet);
            await tx.wait();
          } catch (err) {
            console.log(err);
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

  app.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(app.get("port"), () => {
    console.log(`Listening on ${app.get("port")}`);
  });
});
