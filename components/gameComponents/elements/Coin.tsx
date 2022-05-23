import { sharedInstance as events } from "../EventCenter";

export type CoinType = "dai" | "chainlink" | "matic" | "eth";

export class Coins {
  coins: Map<string, Phaser.Physics.Matter.Sprite> = new Map();
  pickupSound!: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    // Setup coins
    ["dai", "chainlink", "matic", "eth"].map((coinType) => {
      scene.data.set(coinType, 0);
    });

    // add pickup sound
    const pickup = scene.sound.get("coinPickup");
    this.pickupSound = pickup ? pickup : scene.sound.add("coinPickup");
    // create anims
    scene.anims.create({
      key: "spin",
      frameRate: 5,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpin00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    scene.anims.create({
      key: "ChainLinkSpin",
      frameRate: 5,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpinLink00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    scene.anims.create({
      key: "MaticSpin",
      frameRate: 5,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpinMatic00",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    scene.anims.create({
      key: "EthSpin",
      frameRate: 5,
      frames: scene.anims.generateFrameNames("coin", {
        start: 1,
        end: 12,
        prefix: "coinSpinEth00",
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
    const currentCoinLength = this.coins.size;
    coin.setData("coinType", coinType);
    coin.setDisplaySize(70, 70);
    coin.setName("coin");
    switch (coinType) {
      case "eth":
        coin.anims.play("EthSpin", true);
        coin.setData("id", `EthCoin${currentCoinLength + 1}`);
        break;
      case "matic":
        coin.anims.play("MaticSpin", true);
        coin.setData("id", `MaticCoin${currentCoinLength + 1}`);
        break;
      case "chainlink":
        coin.anims.play("ChainLinkSpin", true);
        coin.setData("id", `ChainLinkCoin${currentCoinLength + 1}`);
        break;
      case "dai":
        coin.anims.play("spin", true);
        coin.setData("id", `DaiCoin${currentCoinLength + 1}`);
        break;
      default:
        break;
    }

    this.coins.set(coin.getData("id"), coin);
  }

  pickupCoin(scene: any, coin: Phaser.Physics.Matter.Sprite) {
    const coinType = coin.getData("coinType");
    const current = scene.data.get(coinType);
    const updated = current + 1;
    scene.data.set(coinType, updated);
    events.emit("coinCollected", { coinType, coinCount: updated });
    scene.socket.emit("coinCollected", coin.getData("id"));
    this.playSound();
    coin.destroy();
  }

  findCoin(id: string) {
    const coin = this.coins.get(id);
    return coin;
  }

  playSound() {
    this.pickupSound.play();
  }
}
