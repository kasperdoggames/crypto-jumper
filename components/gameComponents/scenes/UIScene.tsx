import { Scene } from "phaser";
import { sharedInstance as events } from "../EventCenter";
// import { CoinType } from "../elements/Coin";
import { ethers } from "ethers";
import { getGameTokenContract } from "../../../support/eth";
import { P2EGAME_CONTRACT_ADDRESS } from "../../../support/contract_addresses";

export default class UI extends Scene {
  allowanceStat!: Phaser.GameObjects.Text;
  countdownText!: Phaser.GameObjects.Text;
  playerMessage!: Phaser.GameObjects.Text;
  allowance!: number;
  staked!: number;

  constructor() {
    super({
      key: "ui",
    });
  }

  async create() {
    const getAccountAddress = async () => {
      const { ethereum } = window;
      const accounts = await ethereum?.request({ method: "eth_accounts" });
      if (!accounts || accounts.length === 0) {
        console.log("no accounts found");
        return;
      }
      const address = accounts[0];
      return address;
    };

    const fetchPlayerTokenBalance = async () => {
      const { ethereum } = window;
      const gameTokenContract = getGameTokenContract(ethereum);
      const address = await getAccountAddress();
      if (gameTokenContract && gameTokenContract) {
        const balance = await gameTokenContract.balanceOf(address);
        let res = Number(ethers.utils.formatUnits(balance, 18));
        res = Math.round(res * 1e4) / 1e4;
        return res;
      }
    };

    const fetchPlayerTokenAllowance = async () => {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("no eth in window");
        return;
      }
      const gameTokenContract = getGameTokenContract(ethereum);

      const address = await getAccountAddress();
      if (gameTokenContract && address) {
        const allowance = await gameTokenContract.allowance(
          address,
          P2EGAME_CONTRACT_ADDRESS
        );
        let res = Number(ethers.utils.formatUnits(allowance, 18));
        res = Math.round(res * 1e4) / 1e4;
        console.log("gameAllowance: ", res);
        return res;
      }
    };

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

    // const coinCollectedData = {
    //   dai: 0,
    //   chainlink: 0,
    //   matic: 0,
    //   eth: 0,
    // };

    // const displayCoinCount = () => {
    //   let data: string = "";
    //   for (const [key, value] of Object.entries(coinCollectedData)) {
    //     data += `${key}: ${value}\n`;
    //   }
    //   return data;
    // };

    this.allowance = (await fetchPlayerTokenBalance()) || 0;
    this.staked = (await fetchPlayerTokenAllowance()) || 0;

    this.allowanceStat = this.add.text(
      20,
      20,
      `Allowance: ${this.allowance}\nStaked: ${this.staked}`,
      {
        fontSize: "20px",
        color: "#fff",
        fontFamily: "Splatch",
      }
    );

    const screenCenterX = this.game.renderer.width / 2;
    const screenCenterY = this.game.renderer.height / 2;

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

    // events.on(
    //   "coinCollected",
    //   (data: { coinType: CoinType; coinCount: number }) => {
    //     coinCollectedData[data.coinType] = data.coinCount ? data.coinCount : 0;
    //     this.coinCount.setText(displayCoinCount());
    //   }
    // );

    events.on("gameState", async (state: string) => {
      if (state === "newGame") {
        this.allowance = (await fetchPlayerTokenBalance()) || 0;
        this.staked = (await fetchPlayerTokenAllowance()) || 0;
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
