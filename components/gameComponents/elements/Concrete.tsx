export class Concrete {
  scene!: Phaser.Scene;
  concreteTileSprite!: Phaser.GameObjects.TileSprite;
  concreteSprite!: Phaser.Physics.Matter.Sprite;
  concretePart!: Phaser.GameObjects.Rectangle;
  turnToStoneAudio!: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    // add audio
    // this.turnToStoneAudio = scene.sound.add("turnToStoneAudio");

    // create a tile sprite from loaded spritesheet
    this.concreteTileSprite = scene.add.tileSprite(
      x,
      y,
      1400,
      70,
      "concreteTileSprites"
    );
    this.concreteTileSprite.setPosition(x, y);
    this.concreteTileSprite.setFrame(20);

    this.concreteSprite = scene.matter.add
      .sprite(x, y, "concreteSprite")
      .setVisible(false);

    this.concreteSprite.setStatic(true);
    this.concreteSprite.setPosition(x, y + 15);
    this.concreteSprite.setName("concreteSprite");
    this.concreteSprite.setDisplaySize(1400, 70);

    // this will be hidden but something to get a frame index
    this.concreteSprite.anims.create({
      key: "run",
      frameRate: 10,
      frames: this.concreteSprite.anims.generateFrameNames("coin", {
        start: 1,
        end: 4,
        prefix: "coinSpin00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    this.concreteSprite.anims.play("run", true);

    this.concretePart = scene.add.rectangle(0, 0, 1400, 1040, 0x555555);
    this.concretePart.setDepth(1);
    this.concretePart.setPosition(x, y + 550);
  }

  meltSound() {
    if (!this.turnToStoneAudio.isPlaying) {
      this.turnToStoneAudio.play();
    }
  }

  update() {
    // set animation frame
    this.concreteTileSprite.setFrame(
      this.concreteSprite.anims.currentFrame.index + 27
    );
    // move concrete up
    this.concreteSprite.y -= 0.5;
    this.concretePart.y -= 0.5;
    this.concreteTileSprite.y -= 0.5;
  }
}
