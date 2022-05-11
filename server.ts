import express, { Express } from "express";
import next from "next";
import { Server } from "socket.io";
import http from "http";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app: Express = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.set("port", process.env.PORT || 3000);

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.id);

    const existingPlayers = await io.sockets.allSockets();
    existingPlayers.delete(socket.id);

    socket.emit("existingPlayers", {
      players: Array.from(existingPlayers),
    });

    socket.broadcast.emit("existingPlayers", {
      players: Array.from(existingPlayers),
    });

    socket.on("dead", () => {
      socket.broadcast.emit("dead", { id: socket.id });
    });

    socket.on("playerUpdate", (data: any) => {
      socket.broadcast.emit("playerUpdate", { id: socket.id, ...data });
    });

    socket.on("winner", async (data: any) => {
      console.log("winner");
      // pass on data.account for wallet
      // to do call contract with user account/wallet address
      // ethers call to contracts
    });

    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
    });
  });

  app.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(app.get("port"), () => {
    console.log(`Listening on ${app.get("port")}`);
  });
});
