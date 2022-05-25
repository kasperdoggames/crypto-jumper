import socket, { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Coins } from "./elements/Coin";
import { PlayerController } from "./playerController";

export class CustomGameScene extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  player!: PlayerController;
  otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  music!: Phaser.Sound.BaseSound;
  bg_1!: Phaser.GameObjects.TileSprite;
  coins!: Coins;
  start!: { x: number; y: number };
  loading: boolean = true;
  timer!: Phaser.Time.TimerEvent;
  gameId!: string;
  level!: string;
  gameState: gameState = "waiting";
  emitMessages: { key: string; data: any }[] = [];
  dangerZone: any;
  socketClient!: SocketClient;
}

type Player = {
  playerId: string;
  account?: string | undefined;
};

type gameState = "waiting" | "running" | "end";

interface GameLevelData {
  gameId: string;
  players: Player[];
  gameState: gameState;
  winner?: Player;
  roomSet?: string;
}

interface PlayerData {
  playerId: string;
  state: string;
  location: { x: number; y: number };
  flipX: boolean;
}

export default class SocketClient {
  socket!: Socket<DefaultEventsMap, DefaultEventsMap>;
  scene!: CustomGameScene;
  counter: number = 10;

  constructor(scene: CustomGameScene) {
    // load up socketIO
    this.socket = socket();
    this.scene = scene;
    // set loading is true while obtaining list of other players
    this.scene.loading = true;

    this.socket.on("newGame", (data: { roomSet: string; gameId: number }) => {
      if (this.scene.gameState === "end") {
        // reload window
        window.location.reload();
      }
      if (
        this.scene.gameState === "waiting" &&
        data.roomSet === this.scene.level
      ) {
        console.log("newGame received");
        this.scene.emitMessages.push({ key: "gameState", data: "newGame" });
      }
    });

    // wait for response from server on game object
    this.socket.on("gameData", (gameData: GameLevelData) => {
      if (
        this.scene.gameState !== "waiting" ||
        gameData.roomSet !== this.scene.level
      ) {
        return;
      }
      console.log("gameData received: ", { gameData });
      this.scene.gameId = gameData.gameId;
      // refresh all players
      this.scene.otherPlayers.forEach((player) => {
        player.destroy();
      });
      this.scene.otherPlayers.clear();
      // map through existing players and add to game list
      gameData.players.map((otherPlayer: Player, index: number) => {
        // if the first to join the game - set the wait time
        if (this.checkSetTimer(otherPlayer.playerId, index)) {
          return;
        }
        const player = this.scene.add.sprite(0, 0, "coolLink", "idle_01.png");
        player.setAlpha(0.5);
        this.scene.otherPlayers.set(otherPlayer.playerId, player);
        this.scene.gameState = "running";
        this.scene.loading = false;
      });

      // setup channels to listen on..

      // listen on game data updates
      this.socket.on(gameData.gameId, (data: GameLevelData) => {
        if (data.gameState === "end" && this.scene.gameState === "running") {
          let winners = false;
          let playerIsWinner = false;
          console.log("awaiting results...");
          if (data.winner) {
            winners = true;
            if (data.winner.playerId === this.socket.id) {
              playerIsWinner = true;
            }
          }
          this.scene.emitMessages.push({
            key: "awaitingResults",
            data: { winners, playerIsWinner },
          });
          this.scene.gameState = "end";
          this.scene.otherPlayers.forEach((player) => {
            player.anims.play("idle");
          });
          return;
        }
        // refresh all players
        this.scene.otherPlayers.forEach((player) => {
          player.destroy();
        });
        this.scene.otherPlayers.clear();
        // map through existing players and add to game list
        data.players.map((otherPlayer: Player, index: number) => {
          // if the first to join the game - set the wait time
          if (this.checkSetTimer(otherPlayer.playerId, index)) {
            return;
          }
          const player = this.scene.add.sprite(0, 0, "coolLink", "idle_01.png");
          player.setAlpha(0.5);
          this.scene.otherPlayers.set(otherPlayer.playerId, player);
        });
      });

      //listen on player updates
      this.socket.on(`${gameData.gameId}_player`, (playerData: PlayerData) => {
        const otherPlayer = this.scene.otherPlayers.get(playerData.playerId);
        if (!otherPlayer) {
          console.log("no other player", playerData.playerId);
          return;
        }
        if (this.scene.gameState !== "end") {
          otherPlayer.setPosition(playerData.location.x, playerData.location.y);
          otherPlayer?.anims?.play(playerData.state, true);
          otherPlayer?.setFlipX(playerData.flipX);
        }
      });

      // If coin picked up by other player destroy it
      this.socket.on("coinCollected", (id: string) => {
        const coin = this.scene.coins.findCoin(id);
        if (coin) {
          coin.destroy();
        }
      });

      //listen on countdown updates
      this.socket.on(`${gameData.gameId}_countdown`, (counter: number) => {
        this.counter = counter;
        this.scene.emitMessages.push({ key: "countdown", data: this.counter });
      });
    });

    this.socket.on("gameEnd", (gameData: any) => {
      if (this.scene.gameState !== "end") {
        // game end before client game finished
        this.scene.gameState = "end";
        this.scene.emitMessages.push({ key: "gameState", data: "gameTimeout" });
        setTimeout(() => {
          this.scene.emitMessages.push({ key: "leaderBoard", data: gameData });
        }, 3000);
        return;
      }
      this.scene.emitMessages.push({ key: "leaderBoard", data: gameData });
    });

    this.socket.on("dead", (data: any) => {
      console.log("a player died");
      const player = this.scene.otherPlayers.get(data.id);
      if (player) {
        this.scene.otherPlayers.delete(data.id);
        player.destroy();
      }
    });
  }

  updateCounter() {
    if (!this.scene.loading) {
      this.counter--;
      this.scene.emitMessages.push({ key: "countdown", data: this.counter });
      this.socket.emit("countdown", {
        level: this.scene.level,
        gameId: this.scene.gameId,
        counter: this.counter,
      });

      if (this.counter < 0) {
        this.scene.timer.destroy();
        this.socket.emit("gameUpdate", {
          level: this.scene.level,
          gameId: this.scene.gameId,
          state: "running",
        });
      }
    }
  }

  checkSetTimer = (playerId: string, index: number) => {
    if (this.socket.id === playerId && index === 0 && !this.scene.timer) {
      console.log("setting timer");
      this.scene.timer = this.scene.time.addEvent({
        delay: 1000,
        callback: this.updateCounter,
        callbackScope: this,
        loop: true,
      });
      return true;
    }
  };
}
