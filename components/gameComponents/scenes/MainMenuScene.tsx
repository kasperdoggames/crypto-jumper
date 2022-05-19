import "phaser";
import { createButton } from "../elements/ui/CustomButton";
import { ethers } from "ethers";
import { getGameTokenContract } from "../../../support/eth";
import { P2EGAME_CONTRACT_ADDRESS } from "../../../support/contract_addresses";

export default class MainMenu extends Phaser.Scene {
  preload() {
    this.load.image("volcano_bg", "assets/volcano_bg.png");
    this.load.image("logo", "assets/logo.png");
    this.load.image("button1", "assets/ui/blue_button01.png");
    this.load.image("button2", "assets/ui/blue_button02.png");
    this.load.image("button3", "assets/ui/blue_button03.png");
  }

  async create() {
    const fetchPlayerTokenAllowance = async () => {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("no eth in window");
        return;
      }
      const gameTokenContract = getGameTokenContract(ethereum);
      const accounts = await ethereum?.request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        console.log("no accounts found");
        return;
      }
      const address = accounts[0];
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

    this.add.image(0, 0, "volcano_bg").setOrigin(0);
    this.add.image(
      this.game.renderer.width / 2 - 10,
      this.game.renderer.height * 0.35,
      "logo"
    );

    const allowance = await fetchPlayerTokenAllowance();
    if (allowance && allowance > 0) {
      this.scene.start("lavaScene");
    }

    createButton(
      this,
      this.game.renderer.width / 2,
      this.game.renderer.height * 0.7,
      {
        defaultImageName: "button2",
        hoverImageName: "button3",
        clickImageName: "button1",
        label: "Start",
      },
      () => {
        this.scene.start("lavaScene");
      }
    );
  }
}
