import "phaser";
import { createCoin } from "./Coin";
import { Lava } from "./Lava";
import { createPlatform, moveHorizontal, moveVertical } from "./Platform";
import { PlayerController } from "./playerController";

export default class LavaScene extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  player!: PlayerController;
  music!: Phaser.Sound.BaseSound;
  bg_1!: Phaser.GameObjects.TileSprite;
  coinCount!: Phaser.GameObjects.Text;
  lava!: Lava;

  init() {
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

    // lava
    this.load.spritesheet("lavaTileSprites", "assets/lava_tileset.png", {
      frameWidth: 70,
      frameHeight: 70,
    });

    // parallax
    this.load.image("bg_1", "assets/volcano_bg.png");

    // load audio
    this.load.audio("lavaSplash", "assets/lavaSplash.ogg");
  }

  create() {
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

    // Setup coins
    this.data.set("coins", 0);
    this.coinCount = this.add.text(20, 20, "", {
      fontSize: "32px",
      color: "#fff",
    });

    const coins = this.data.get("coins");
    this.coinCount.setText([`Coins: ${coins ? coins : "0"}`]);
    this.coinCount.setScrollFactor(0);

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
          break;
        case "lava":
          this.lava = new Lava(this, x, y);
          break;
        case "coin":
          createCoin(this, x, y);
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
          // This seems to trigger when not collided? But doesn't restart level
          console.log("game over?");
          this.lava.meltSound();
          this.player.stateMachine.transition("melt");
        } else if (other.gameObject?.name === "coin") {
          const sprite: Phaser.Physics.Matter.Sprite = other.gameObject;
          const current = this.data.get("coins");
          this.data.set("coins", current + 1);
          const coins = this.data.get("coins");
          this.coinCount.setText([`Coins: ${coins ? coins : "0"}`]);
          sprite.destroy();
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
  }

  update() {
    // run through state for player controller
    this.player.stateMachine.step();
    this.lava.update();
  }
}
