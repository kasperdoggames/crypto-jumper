export class Coins {
  coins: Phaser.Physics.Matter.Sprite[] = [];
  pickupSound!: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    this.pickupSound = scene.sound.add("coinPickup");
    scene.anims.create({
      key: "spin",
      frameRate: 10,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpin00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
  }

  addCoin(scene: Phaser.Scene, x: number, y: number) {
    const coin = scene.matter.add.sprite(x, y, "coin", "coinSpin0001.png", {
      isStatic: true,
      isSensor: true,
    });
    coin.setName("coin");
    coin.setDisplaySize(70, 70);
    coin.anims.play("spin", true);
    this.coins.push(coin);
  }

  playSound() {
    this.pickupSound.play();
  }
}
