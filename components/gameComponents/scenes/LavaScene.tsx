import "phaser";
import { Coins, CoinType } from "../elements/Coin";
import { Lava } from "../elements/Lava";
import {
  createPlatform,
  moveHorizontal,
  moveVertical,
} from "../elements/Platform";
import { PlayerController } from "../playerController";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import socket from "socket.io-client";
import { sharedInstance as events } from "../EventCenter";

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
}

interface PlayerData {
  playerId: string;
  state: string;
  location: { x: number; y: number };
  flipX: boolean;
}

export default class LavaScene extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  player!: PlayerController;
  otherPlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  music!: Phaser.Sound.BaseSound;
  bg_1!: Phaser.GameObjects.TileSprite;
  lava!: Lava;
  coins!: Coins;
  socket!: Socket<DefaultEventsMap, DefaultEventsMap>;
  start!: { x: number; y: number };
  loading: boolean = true;
  counter: number = 10;
  timer!: Phaser.Time.TimerEvent;
  gameId!: string;
  level!: string;
  gameState: gameState = "waiting";
  emitMessages: { key: string; data: any }[] = [];

  loadFromSocket() {
    // load up socketIO
    this.socket = socket();
    // set loading is true while obtaining list of other players
    this.loading = true;

    const checkSetTimer = (playerId: string, index: number) => {
      if (this.socket.id === playerId && index === 0 && !this.timer) {
        this.timer = this.time.addEvent({
          delay: 1000,
          callback: this.updateCounter,
          callbackScope: this,
          loop: true,
        });
        return true;
      }
    };

    this.socket.on("newGame", () => {
      if (this.gameState === "end") {
        // reload window
        window.location.reload();
      }
      if (this.gameState === "waiting") {
        console.log("newGame received");
        this.emitMessages.push({ key: "gameState", data: "newGame" });
      }
    });

    // wait for response from server on game object
    this.socket.on("gameData", (gameData: GameLevelData) => {
      if (this.gameState !== "waiting") {
        return;
      }
      console.log("gameData received: ", { gameData });
      this.gameId = gameData.gameId;
      // refresh all players
      this.otherPlayers.forEach((player) => {
        player.destroy();
      });
      this.otherPlayers.clear();
      // map through existing players and add to game list
      gameData.players.map((otherPlayer: Player, index: number) => {
        // if the first to join the game - set the wait time
        if (checkSetTimer(otherPlayer.playerId, index)) {
          return;
        }
        const player = this.add.sprite(0, 0, "coolLink", "idle_01.png");
        player.setAlpha(0.5);
        this.otherPlayers.set(otherPlayer.playerId, player);
        this.gameState = "running";
        this.loading = false;
      });

      // setup channels to listen on..

      // listen on game data updates
      this.socket.on(`lava_${gameData.gameId}`, (data: GameLevelData) => {
        if (data.gameState === "end" && this.gameState === "running") {
          let isWinner = false;
          console.log("awaiting results...");
          if (data.winner && data.winner.playerId === this.socket.id) {
            isWinner = true;
          }
          events.emit("awaitingResults", isWinner);
          this.gameState = "end";
          this.otherPlayers.forEach((player) => {
            player.anims.play("idle");
          });
          return;
        }
        // refresh all players
        this.otherPlayers.forEach((player) => {
          player.destroy();
        });
        this.otherPlayers.clear();
        // map through existing players and add to game list
        data.players.map((otherPlayer: Player, index: number) => {
          // if the first to join the game - set the wait time
          if (checkSetTimer(otherPlayer.playerId, index)) {
            return;
          }
          const player = this.add.sprite(0, 0, "coolLink", "idle_01.png");
          player.setAlpha(0.5);
          this.otherPlayers.set(otherPlayer.playerId, player);
        });
      });

      //listen on player updates
      this.socket.on(
        `lava_${gameData.gameId}_player`,
        (playerData: PlayerData) => {
          const otherPlayer = this.otherPlayers.get(playerData.playerId);
          if (!otherPlayer) {
            console.log("no other player", playerData.playerId);
            return;
          }
          if (this.gameState !== "end") {
            otherPlayer.setPosition(
              playerData.location.x,
              playerData.location.y
            );
            otherPlayer?.anims?.play(playerData.state, true);
            otherPlayer?.setFlipX(playerData.flipX);
          }
        }
      );

      // If coin picked up by other player destroy it
      this.socket.on("coinCollected", (id: string) => {
        const coin = this.coins.findCoin(id);
        if (coin) {
          coin.destroy();
        }
      });

      //listen on countdown updates
      this.socket.on(`lava_${gameData.gameId}_countdown`, (counter: number) => {
        this.counter = counter;
        events.emit("countdown", this.counter);
      });
    });

    this.socket.on("gameEnd", (gameData: any) => {
      if (this.gameState !== "end") {
        return;
      }
      events.emit("gameState", "gameEnd");
      this.emitMessages.push({ key: "leaderBoard", data: gameData });
    });

    this.socket.on("dead", (data: any) => {
      console.log("a player died");
      const player = this.otherPlayers.get(data.id);
      if (player) {
        this.otherPlayers.delete(data.id);
        player.destroy();
      }
    });
  }

  updateCounter() {
    if (!this.loading) {
      this.counter--;
      events.emit("countdown", this.counter);
      this.socket.emit("countdown", {
        level: "lava",
        gameId: this.gameId,
        counter: this.counter,
      });

      if (this.counter < 0) {
        this.timer.destroy();
        this.socket.emit("gameUpdate", {
          level: this.level,
          gameId: this.gameId,
          state: "running",
        });
      }
    }
  }

  init() {
    this.level = "lava";
    // Load UI
    this.scene.launch("ui");
    this.scene.launch("dialog");
    // load up socketIO
    this.loadFromSocket();
    // init the keyboard inputs
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  preload() {
    // Load all assets for level
    this.load.atlas("coolLink", "assets/coolLink.png", "assets/coolLink.json");

    // tilemaps
    this.load.image("lava_tiles", "assets/lava_tileset.png");
    this.load.tilemapTiledJSON("tilemap", "assets/lava_scene.json");

    // coins and platforms
    this.load.atlas("coin", "assets/coin.png", "assets/coin.json");
    this.load.image("platformA", "assets/platformA.png");
    this.load.image("bell", "assets/bell.png");

    // lava
    this.load.spritesheet("lavaTileSprites", "assets/lava_tileset.png", {
      frameWidth: 70,
      frameHeight: 70,
    });

    // parallax
    this.load.image("bg_1", "assets/volcano_bg.png");

    // load audio
    this.load.audio("lavaMusic", "assets/lavaMusic.mp3");
    this.load.audio("lavaSplash", "assets/lavaSplash.ogg");
    this.load.audio("coinPickup", "assets/coinPickup.ogg");
    this.load.audio("bell", "assets/bell.mp3");
  }

  create() {
    // create coins class
    this.coins = new Coins(this);
    // create the tile map instance
    const map = this.make.tilemap({ key: "tilemap" });
    // add the tileset to the map
    const tileset = map.addTilesetImage("lava_tileset", "lava_tiles");
    // create the ground layer from the loaded tileset
    const ground = map.createLayer("ground", tileset);
    // set collisions based on custom value on the tilesheet data
    ground.setCollisionByProperty({ collides: true });

    // testing parallax
    this.bg_1 = this.add.tileSprite(
      0,
      0,
      Number(this.game.renderer.width),
      Number(this.game.renderer.height),
      "bg_1"
    );
    this.bg_1.setOrigin(0, 0);
    this.bg_1.setScrollFactor(0);
    this.bg_1.setDepth(-1);

    // convert the layer to matter physics for ground
    this.matter.world.convertTilemapLayer(ground);

    // creatre bounds for the sprite
    const bounds = this.matter.world.setBounds(
      0,
      0,
      ground.width,
      ground.height
    );

    // label the walls as "bounds"
    Object.values(bounds.walls).forEach((o) => (o.label = "bounds"));

    // get objects layer from the tilemap
    const objectsLayer = map.getObjectLayer("objects");

    // create player controller/state
    this.player = new PlayerController(this);

    // loop over all objects in the object layer to assign objects
    objectsLayer.objects.forEach((element) => {
      const { x = 0, y = 0, name } = element;

      switch (name) {
        case "start":
          this.player.sprite.setPosition(x - 1, y);
          this.start = { x, y };
          break;
        case "finish":
          this.matter.add
            .sprite(x, y, "bell")
            .setStatic(true)
            .setName("finish");
          break;
        case "lava":
          this.lava = new Lava(this, x, y);
          break;
        case "coin":
          const coinType: CoinType = element.properties[0]?.value;
          this.coins.addCoin(this, x, y, coinType);
          break;
        case "platformA":
          const platformA = createPlatform(this, x, y, "platformA");
          moveVertical(this, platformA);
          break;
        case "platformB":
          const platformB = createPlatform(this, x, y, "platformA");
          moveHorizontal(this, platformB);
          break;
        default:
          break;
      }
    });

    // setup collisions
    this.matter.world.on(
      "collisionstart",
      (_event: any, bodyA: any, bodyB: any) => {
        // don't care about any other collisions
        if (
          bodyA.gameObject?.name !== "coolLink" &&
          bodyB.gameObject?.name !== "coolLink"
        ) {
          return;
        }
        const [coolLink, other] =
          bodyB.gameObject?.name === "coolLink"
            ? [bodyB, bodyA]
            : [bodyA, bodyB];
        if (other.gameObject?.name === "lavaSprite") {
          this.lava.meltSound();
          this.player.stateMachine.transition("melt");
          return;
        }
        if (other.gameObject?.name === "coin") {
          this.coins.pickupCoin(this, other.gameObject);
          return;
        }
        if (other.gameObject?.name === "finish") {
          const finish = this.sound.get("bell");
          finish.play();
          this.player.sprite.anims.play("idle");
          this.counter = 10;
          this.socket.emit("gameUpdate", {
            level: this.level,
            gameId: this.gameId,
            state: "end",
          });
        }
        if (other.position.y > coolLink.position.y) {
          this.player.isTouchingGround = true;
          return;
        }
        other.friction = 0;
      }
    );

    // set bounds for the camera
    this.cameras.main.setBounds(0, 0, ground.width, ground.height);
    // camera to follow the player (this will change to auto scroll up)
    this.cameras.main.startFollow(this.player.sprite, true);

    if (!this.sound.get("lavaMusic")) {
      // add background music
      this.music = this.sound.add("lavaMusic", {
        delay: 0,
        loop: true,
        seek: 0,
        mute: false,
        volume: 0.2,
        rate: 1,
        detune: 0,
      });
    }

    if (!this.sound.get("bell")) {
      this.sound.add("bell");
    }
    // Background music
    if (!this.sound.locked) {
      // already unlocked so play
      if (!this.music.isPlaying) {
        this.music.play();
      }
    } else {
      // wait for 'unlocked' to fire and then play
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (!this.music.isPlaying) {
          this.music.play();
        }
      });
    }

    // pause on blur and resume when back
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        return;
      }
      this.music?.pause();
    });

    this.game.events.on(Phaser.Core.Events.RESUME, () => {
      if (this.music.isPaused) {
        this.music.resume();
      }
    });

    events.on("dead", () => {
      console.log("player died");
      this.socket.emit("dead");
      // get players and sort based on highest point
      this.otherPlayers.delete(this.socket.id);
      const ordered = Array.from(this.otherPlayers.values()).sort(
        (a, b) => b.y - a.y
      );

      if (ordered.length === 0 && this.gameState === "running") {
        // emit end game as all players dead
        console.log("end game request");
        this.counter = 10;
        this.socket.emit("gameUpdate", {
          level: this.level,
          gameId: this.gameId,
          state: "end",
        });
        return;
      }
      // follow highest player
      try {
        this.cameras.main.startFollow(ordered[0]);
      } catch (err) {
        console.log(err);
      }
    });
  }

  update() {
    if (this.emitMessages.length > 0) {
      for (let i = 0; i < this.emitMessages.length; i++) {
        const data = this.emitMessages.pop();
        if (data) {
          events.emit(data.key, data.data);
        }
      }
    }
    if (this.loading || this.counter >= 0) {
      return;
    }
    if (this.gameState !== "end") {
      // run through state for player controller
      this.player.stateMachine.step();
      // update lava
      this.lava.update();
    }
  }
}
