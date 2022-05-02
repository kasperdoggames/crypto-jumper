import "phaser";
import { createCoin } from "./Coin";
import { createLava } from "./Lava";
import { createPlatform, moveHorizontal, moveVertical } from "./Platform";
import { PlayerController } from "./playerController";

export default class Main extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  player!: PlayerController;
  star!: Phaser.Physics.Matter.Sprite;
  music!: Phaser.Sound.BaseSound;
  lava!: Phaser.Physics.Matter.Sprite;
  lavapart!: Phaser.GameObjects.Rectangle;
  bg_1!: Phaser.GameObjects.TileSprite;
  coinCount!: Phaser.GameObjects.Text;

  init() {
    // init the keyboard inputs
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  preload() {
    // Load all assets for level
    this.load.atlas("coolLink", "assets/coolLink.png", "assets/coolLink.json");
    this.load.image("tiles", "assets/tilemap_snow.png");
    this.load.atlas("lava", "assets/lava.png", "assets/lava.json");
    this.load.tilemapTiledJSON("tilemap", "assets/tilemap_snow.json");
    this.load.atlas("coin", "assets/coin.png", "assets/coin.json");
    this.load.image("platformA", "assets/platformA.png");

    // testing parallax
    this.load.image("bg_1", "assets/background.png");
  }

  create() {
    // create the tile map instance
    const map = this.make.tilemap({ key: "tilemap" });
    // add the tileset to the map
    const tileset = map.addTilesetImage("tilemap_snow", "tiles");
    // create the ground layer from the loaded tileset
    const ground = map.createLayer("ground", tileset);
    // set collisions based on custom value on the tilesheet data
    ground.setCollisionByProperty({ collides: true });

    // testing parallax
    this.bg_1 = this.add.tileSprite(0, 0, ground.width, ground.height, "bg_1");
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

    // create a player instance from the spritesheet
    const player = this.matter.add
      .sprite(0, 0, "coolLink", "run_01.png")
      .setFixedRotation();

    // add a name for the player
    player.setName("coolLink");

    // create player controller/state
    this.player = new PlayerController(this, player);

    // loop over all objects in the object layer to assign objects
    objectsLayer.objects.forEach((element) => {
      const { x = 0, y = 0, name } = element;

      switch (name) {
        case "start":
          player.setPosition(x - 1, y);
          break;
        case "lava":
          const { lava, lavapart } = createLava(this, x, y);
          this.lava = lava;
          this.lavapart = lavapart;
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

    // set bounds for the camera
    this.cameras.main.setBounds(0, 0, ground.width, ground.height);
    // camera to follow the player (this will change to auto scroll up)
    this.cameras.main.startFollow(this.player.sprite, true);
  }

  update() {
    // run through state for player controller
    this.player.stateMachine.step();
    // increase the rise of over time?
    this.lava.y -= 2.7;
    this.lavapart.y -= 2.7;
    this.bg_1.tilePositionY = this.cameras.main.scrollY * 0.3;
  }
}
