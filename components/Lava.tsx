export class Lava {
  scene!: Phaser.Scene;
  lavaTileSprite!: Phaser.GameObjects.TileSprite;
  lavaSprite!: Phaser.Physics.Matter.Sprite;
  lavapart!: Phaser.GameObjects.Rectangle;
  lavaSplashAudio!: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    // add audio
    this.lavaSplashAudio = scene.sound.add("lavaSplash");
    // create a tile sprite from loaded spritesheet
    this.lavaTileSprite = scene.add.tileSprite(
      x,
      y,
      1400,
      70,
      "lavaTileSprites"
    );
    this.lavaTileSprite.setPosition(x, y);
    this.lavaTileSprite.setFrame(20);

    this.lavaSprite = scene.matter.add
      .sprite(x, y, "lavaSprite")
      .setVisible(false);

    this.lavaSprite.setStatic(true);
    this.lavaSprite.setPosition(x, y + 15);
    this.lavaSprite.setName("lavaSprite");
    this.lavaSprite.setDisplaySize(1400, 70);

    // this will be hidden but something to get a frame index
    this.lavaSprite.anims.create({
      key: "run",
      frameRate: 10,
      frames: this.lavaSprite.anims.generateFrameNames("coin", {
        start: 1,
        end: 4,
        prefix: "coinSpin00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    this.lavaSprite.anims.play("run", true);

    this.lavapart = scene.add.rectangle(0, 0, 1400, 1040, 0xfc8801);
    this.lavapart.setDepth(1);
    this.lavapart.setPosition(x, y + 550);
  }

  meltSound() {
    if (!this.lavaSplashAudio.isPlaying) {
      this.lavaSplashAudio.play();
    }
  }

  update() {
    // set animation frame
    this.lavaTileSprite.setFrame(this.lavaSprite.anims.currentFrame.index + 19);
    // move lava up
    this.lavaSprite.y -= 0.5;
    this.lavapart.y -= 0.5;
    this.lavaTileSprite.y -= 0.5;
  }
}
