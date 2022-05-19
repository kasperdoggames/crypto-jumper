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
    const exitButton = this.add.text(
      this.game.renderer.width - 150,
      20,
      "< Quit >",
      {
        fontSize: "20px",
        color: "#fff",
        fontFamily: "Splatch",
      }
    );
    // .setFont("250%");
    exitButton.setInteractive();
    exitButton.on("pointerover", () => {
      exitButton
        .setFontSize(24)
        .setPosition(this.game.renderer.width - 160, 20);
    });

    exitButton.on("pointerout", () => {
      exitButton
        .setFontSize(20)
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
      fontFamily: "Splatch",
    });

    const screenCenterX =
      this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const screenCenterY =
      this.cameras.main.worldView.y + this.cameras.main.height / 2;

    this.countdownText = this.add
      .text(screenCenterX, 330, "Waiting for a new game to start...", {
        fontSize: "30px",
        color: "#fff",
        fontFamily: "Splatch",
      })
      .setOrigin(0.5);

    this.playerMessage = this.add
      .text(screenCenterX, 330, "", {
        fontSize: "30px",
        color: "#fff",
        fontFamily: "Splatch",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    events.on(
      "coinCollected",
      (data: { coinType: CoinType; coinCount: number }) => {
        coinCollectedData[data.coinType] = data.coinCount ? data.coinCount : 0;
        this.coinCount.setText(displayCoinCount());
      }
    );

    events.on("gameState", (state: string) => {
      if (state === "newGame") {
        this.countdownText.setAlpha(0);
      } else {
        this.countdownText.setText("Waiting for a new game to start...");
        this.countdownText.setAlpha(1);
      }
    });

    events.on("playerAdded", () => {
      this.countdownText.setText("Waiting for other players...");
      this.countdownText.setAlpha(1);
    });

    events.on("countdown", (counter: number) => {
      if (counter < 0) {
        this.countdownText.setAlpha(0);
      } else {
        this.countdownText.setAlpha(1);
        this.countdownText.setText(`Starting in ... ${counter}`);
      }
    });

    events.on("playerMessage", (message: string) => {
      this.playerMessage.setText(message).setAlpha(1);
    });
  }
}
