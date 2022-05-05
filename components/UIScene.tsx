import { Scene } from "phaser";
import { sharedInstance as events } from "./EventCenter";
import { CoinType } from "./Coin";

export default class UI extends Scene {
  daiCount!: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: "ui",
    });
  }

  create() {
    this.daiCount = this.add.text(20, 20, "dai: 0", {
      fontSize: "32px",
      color: "#fff",
    });

    events.on(
      "coinCollected",
      (data: { coinType: CoinType; coinCount: number }) => {
        this.daiCount.setText([
          `dai: ${data.coinCount ? data.coinCount : "0"}`,
        ]);
      }
    );
  }
}
