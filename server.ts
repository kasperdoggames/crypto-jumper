import express, { Express } from "express";
import next from "next";
import { Server } from "socket.io";
import http from "http";
import { v4 as uuidv4 } from "uuid";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

interface GameLevelData {
  players: string[]; //todo: {account: string | undefined, socketId: string}[]
  gameState: "waiting" | "running" | "end";
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
  const playersWaiting: string[] = [];
  const assignedPlayers = new Map<string, string>();

  let gameState: "begin" | "new" | "started" | "finished";

  app.set("port", process.env.PORT || 3000);

  // call contract for state and update gameState var
  /*
    gameSate =  p2eGameContract.getGameSessionState();
  */

  // start listener to contract..

  /*
     test via simulator....

      p2eGameContract.on("newGame", (gameId: any) => {
        gameState = "new"
        io.emit("newGame", {gameId}))
      })

       p2eGameContract.on("gameStarted", (gameId: any) => {
        gameState = "started"
      })

       p2eGameContract.on("gameFinished", (gameId: any) => {
        gameState = "finished"
      })

       p2eGameContract.on("gameSettled", (gameId: any) => {
         
      })

      p2eGameContract.on("PlayerJoinedGame", (address, clientId) => {
        console.log("PlayerJoinedGame", address, clientId);
      });
    */

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);

    if (gameState === "new") {
      io.emit("newGame");
    }

    const createLevel = (roomRequested: string) => {
      const gameId = uuidv4();
      const gameData: GameLevelData = {
        players: [socket.id],
        gameState: "waiting",
      };
      const newSlot = new Map<string, GameLevelData>();
      newSlot.set(gameId, gameData);
      gameRooms.set(roomRequested, newSlot);
      assignedPlayers.set(socket.id, `${roomRequested}_${gameId}`);
      // emit game data back to client to allow it to listen on the gameId for updates
      socket.emit("gameData", { gameId, ...gameData });
      // broadcast for any other players on same channel
      socket.broadcast.emit(`${roomRequested}_${gameId}`, {
        gameId,
        ...gameData,
      });
    };

    socket.on("gameRequest", (roomRequested: string) => {
      // look for existing level
      const levelData = gameRooms.get(roomRequested);
      // if no level, create one and add player to slot 1
      if (!levelData || levelData.size === 0) {
        createLevel(roomRequested);
        return;
      }
      // else check player count in last slot
      const lastSlot = Array.from(levelData).pop();
      if (!lastSlot) {
        createLevel(roomRequested);
        return;
      }
      lastSlot[1].players = lastSlot[1].players.filter((player) => {
        const playerSocket = io.sockets.sockets.get(player);
        return playerSocket?.connected;
      });
      if (lastSlot[1].players.length === 0) {
        createLevel(roomRequested);
        return;
      }
      if (
        lastSlot[1].players.length >= 10 ||
        lastSlot[1].gameState === "end" ||
        lastSlot[1].gameState === "running"
      ) {
        // // create a new slot for users if multiple game sessions
        // const gameId = uuidv4();
        // const gameData: GameLevelData = {
        //   players: [socket.id],
        //   gameState: "waiting",
        // };
        // levelData.set(gameId, gameData);
        // gameRooms.set(roomRequested, levelData);
        // // emit game data back to client to allow it to listen on the gameId for updates
        // socket.emit("gameData", { gameId, ...gameData });
        // // broadcast for any other players on same channel
        // socket.broadcast.emit(`${roomRequested}_${gameId}`, {
        //   gameId,
        //   ...gameData,
        // });

        // add to queue of waiting users
        playersWaiting.push(socket.id);
        return;
      }
      lastSlot[1].players.push(socket.id);
      levelData.set(lastSlot[0], lastSlot[1]);
      gameRooms.set(roomRequested, levelData);
      assignedPlayers.set(socket.id, `${roomRequested}_${lastSlot[0]}`);
      socket.emit("gameData", { gameId: lastSlot[0], ...lastSlot[1] });
      // broadcast for any other players on same channel
      socket.broadcast.emit(`${roomRequested}_${lastSlot[0]}`, lastSlot[1]);
    });

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

    const resetGame = (levelName: string, oldGameId: string) => {
      const levelData = gameRooms.get(levelName);
      if (!levelData) {
        console.log("no level data");
        return;
      }
      levelData.delete(oldGameId);
      const players = playersWaiting.slice(0, 10).filter((player: string) => {
        const playerSocket = io.sockets.sockets.get(player);
        return playerSocket?.connected;
      });
      const gameId = uuidv4();
      const gameData: GameLevelData = {
        players,
        gameState: "waiting",
      };
      levelData.set(gameId, gameData);
      gameRooms.set(levelName, levelData);
      // let all players know the game config
      players.map((player) => {
        socket.to(player).emit("gameData", { gameId, ...gameData });
      });
    };

    /*
      client provides game updates for game state
    */
    socket.on(
      "gameUpdate",
      (data: {
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
          resetGame(data.level, data.gameId);
          return;
        }
        gameData.gameState = data.state;
        levelData.set(data.gameId, gameData);
        gameRooms.set(data.level, levelData);
      }
    );

    socket.on("winner", async (data: any) => {
      console.log("winner");
      // pass on data.account for wallet
      // to do call contract with user account/wallet address
      // ethers call to contracts
    });

    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
      const game = assignedPlayers.get(socket.id);
      if (!game) {
        return;
      }
      assignedPlayers.delete(socket.id);
      const split = game.split("_");
      const [levelName, gameId] = split;
      const level = gameRooms.get(levelName);
      if (!level) {
        return;
      }
      const gameData = level.get(gameId);
      if (!gameData) {
        return;
      }
      if (gameData.players.length > 1) {
        socket.broadcast.emit("dead", { id: socket.id });
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
