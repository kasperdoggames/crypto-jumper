import { Scene } from "phaser";
import { sharedInstance as events } from "../EventCenter";
import { CoinType } from "../elements/Coin";

export default class UI extends Scene {
  coinCount!: Phaser.GameObjects.Text;
  countdownText!: Phaser.GameObjects.Text;
  playerMessage!: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: "ui",
    });
  }

  create() {
    const exitButton = this.add
      .text(this.game.renderer.width - 150, 20, "< Quit >")
      .setFont("250%");
    exitButton.setInteractive();
    exitButton.on("pointerover", () => {
      exitButton
        .setFont("280%")
        .setPosition(this.game.renderer.width - 160, 20);
    });

    exitButton.on("pointerout", () => {
      exitButton
        .setFont("250%")
        .setPosition(this.game.renderer.width - 150, 20);
    });

    exitButton.on("pointerup", () => {
      window.location.reload();
    });

    const coinCollectedData = {
      dai: 0,
      chainlink: 0,
      matic: 0,
      eth: 0,
    };

    const displayCoinCount = () => {
      let data: string = "";
      for (const [key, value] of Object.entries(coinCollectedData)) {
        data += `${key}: ${value}\n`;
      }
      return data;
    };

    this.coinCount = this.add.text(20, 20, displayCoinCount(), {
      fontSize: "20px",
      color: "#fff",
    });

    this.countdownText = this.add.text(180, 150, "Waiting for available game", {
      fontSize: "30px",
      color: "#fff",
    });

    this.playerMessage = this.add
      .text(180, 150, "", {
        fontSize: "30px",
        color: "#fff",
      })
      .setAlpha(0);

    events.on(
      "coinCollected",
      (data: { coinType: CoinType; coinCount: number }) => {
        coinCollectedData[data.coinType] = data.coinCount ? data.coinCount : 0;
        this.coinCount.setText(displayCoinCount());
      }
    );
    events.on("countdown", (counter: number) => {
      if (counter < 0) {
        this.countdownText.setAlpha(0);
      } else {
        this.countdownText.setText(`Waiting for other players... ${counter}`);
      }
    });

    events.on("playerMessage", (message: string) => {
      this.playerMessage.setText(message).setAlpha(1);
    });
  }
}
