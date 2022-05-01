import "phaser";
import { PlayerController } from "./playerController";

export default class Main extends Phaser.Scene {
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  player!: PlayerController;
  star!: Phaser.Physics.Matter.Sprite;
  music!: Phaser.Sound.BaseSound;
  lava!: Phaser.Physics.Matter.Sprite;
  lavapart!: any;
  platforms: { sprite: Phaser.Physics.Matter.Sprite; x: number; y: number }[] =
    [];

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

    this.lavapart = this.add.rectangle(0, 0, 1400, 1040, 0xe4b108);
    this.lava = this.matter.add.sprite(0, 0, "lava");
    this.lava.setStatic(true);
    this.lava.setDisplaySize(1400, 240);
    this.lava.setName("lava");
    this.lavapart.setName("lava");

    this.lava.anims.create({
      key: "bubble",
      frameRate: 18,
      frames: this.lava.anims.generateFrameNames("lava", {
        start: 20,
        end: 50,
        prefix: "lava00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });

    this.lava.anims.play("bubble", true);

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
          this.lavapart.setPosition(x, y + 1400);
          this.lava.setPosition(x, y + 1000);
          break;
        // testing coin pick up logic - to move to separate controller logic
        case "coin":
          const coin = this.matter.add.sprite(
            x,
            y,
            "coin",
            "coinSpin0001.png",
            {
              isStatic: true,
              isSensor: true,
            }
          );
          coin.setName("coin");
          coin.setDisplaySize(70, 70);
          coin.anims.create({
            key: "spin",
            frameRate: 20,
            frames: coin.anims.generateFrameNames("coin", {
              start: 1,
              end: 12,
              prefix: "coinSpin00",
              suffix: ".png",
              zeroPad: 2,
            }),
            repeat: -1,
          });
          coin.anims.play("spin", true);
          break;
        // testing vertical platform logic -  to move to separate controller logic
        case "platformA":
          const startY = y;
          const platform = this.matter.add.image(x, y, "platformA");
          platform.setStatic(true);
          platform.setName("platformA");
          // make the distance arguments to separate logic on tween
          this.tweens.addCounter({
            from: 0,
            to: -200,
            duration: 1500,
            ease: Phaser.Math.Easing.Sine.InOut,
            repeat: -1,
            yoyo: true,
            onUpdate: (_tween, target) => {
              const destY = startY + target.value;
              const dy = destY - platform.y;
              platform.y = destY;
              platform.setVelocityY(dy);
            },
          });
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
    this.lava.y -= 2;
    this.lavapart.y -= 2;
  }
}
