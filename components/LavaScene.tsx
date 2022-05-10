import "phaser";
import { Coins, CoinType } from "./Coin";
import { Lava } from "./Lava";
import { createPlatform, moveHorizontal, moveVertical } from "./Platform";
import { PlayerController } from "./playerController";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import socket from "socket.io-client";

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

  init() {
    // init the keyboard inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.socket = socket();
    this.socket.on("newPlayer", (data: any) => {
      const existing = this.otherPlayers.get(data.id);
      if (existing) {
        return;
      } else {
        const player = this.add.sprite(0, 0, "coolLink", "idle_01.png");
        player.setAlpha(0.5);

        // add other player to list
        this.otherPlayers.set(data.id, player);
        player.setPosition(this.start.x - 1, this.start.y);
      }
    });

    this.socket.on("playerUpdate", (data: any) => {
      const player = this.otherPlayers.get(data.id);
      if (player) {
        player.setPosition(data.location.x, data.location.y);
        player?.anims?.play(data.state, true);
        player.setFlipX(data.flipX);
      }
    });

    this.socket.on("dead", (data: any) => {
      const player = this.otherPlayers.get(data.id);
      if (player) {
        this.otherPlayers.delete(data.id);
        player.destroy();
      }
    });
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
  }

  create() {
    // Load UI
    this.scene.launch("ui");
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
      Number(this.game.config.width),
      Number(this.game.config.height),
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
        } else if (other.gameObject?.name === "coin") {
          this.coins.pickupCoin(this, other.gameObject);
        } else if (other.position.y > coolLink.position.y) {
          this.player.isTouchingGround = true;
        } else {
          other.friction = 0;
        }
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
      this.music.pause();
    });

    this.game.events.on(Phaser.Core.Events.RESUME, () => {
      if (this.music.isPaused) {
        this.music.resume();
      }
    });
  }

  update() {
    // run through state for player controller
    this.player.stateMachine.step();
    // update lava
    this.lava.update();
  }
}
