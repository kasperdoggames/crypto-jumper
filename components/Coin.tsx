import { sharedInstance as events } from "./EventCenter";

export type CoinType = "dai" | "chainlink" | "matic" | "eth";

export class Coins {
  coins: Phaser.Physics.Matter.Sprite[] = [];
  pickupSound!: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    // Setup coins
    ["dai", "chainlink", "matic", "eth"].map((coinType) => {
      scene.data.set(coinType, 0);
    });

    // add pickup sound
    this.pickupSound = scene.sound.add("coinPickup");
    // create anims
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

  addCoin(scene: Phaser.Scene, x: number, y: number, coinType: CoinType) {
    const coin = scene.matter.add.sprite(x, y, "coin", "coinSpin0001.png", {
      isStatic: true,
      isSensor: true,
    });
    coin.setName("coin");
    coin.setData("coinType", coinType);
    coin.setDisplaySize(70, 70);
    coin.anims.play("spin", true);
    this.coins.push(coin);
  }

  pickupCoin(scene: Phaser.Scene, coin: Phaser.Physics.Matter.Sprite) {
    const coinType = coin.getData("coinType");
    const current = scene.data.get(coinType);
    const updated = current + 1;
    scene.data.set(coinType, updated);
    events.emit("coinCollected", { coinType, coinCount: updated });
    this.playSound();
    coin.destroy();
  }

  playSound() {
    this.pickupSound.play();
  }
}
