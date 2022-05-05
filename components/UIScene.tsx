import { Scene } from "phaser";
import { sharedInstance as events } from "./EventCenter";
import { CoinType } from "./Coin";

export default class UI extends Scene {
  daiCount!: Phaser.GameObjects.Text;
  chainCount!: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: "ui",
    });
  }

  create() {
    this.daiCount = this.add.text(20, 20, "dai : 0", {
      fontSize: "32px",
      color: "#fff",
    });

    this.chainCount = this.add.text(20, 50, "link: 0", {
      fontSize: "32px",
      color: "#fff",
    });

    events.on(
      "coinCollected",
      (data: { coinType: CoinType; coinCount: number }) => {
        switch (data.coinType) {
          case "dai":
            this.daiCount.setText([
              `dai:  ${data.coinCount ? data.coinCount : "0"}`,
            ]);
            break;
          case "chainlink":
            this.chainCount.setText([
              `link: ${data.coinCount ? data.coinCount : "0"}`,
            ]);
            break;

          default:
            break;
        }
      }
    );
  }
}
