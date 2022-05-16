import { Scene } from "phaser";
import { createButton } from "../elements/ui/CustomButton";
import { getP2EGameContract } from "../../../support/eth";
import LavaScene from "./LavaScene";
import { sharedInstance as events } from "../EventCenter";

export default class Dialog extends Scene {
  coinCount!: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: "dialog",
    });
  }

  // load up button assets
  preload() {
    this.load.image("button1", "assets/ui/blue_button01.png");
    this.load.image("button2", "assets/ui/blue_button02.png");
    this.load.image("button3", "assets/ui/blue_button03.png");
  }

  create() {
    const addPlayer = async () => {
      const { ethereum } = window;
      const p2eGameContract = getP2EGameContract(ethereum);
      if (p2eGameContract) {
        try {
          const lavaScene = this.scene.manager.getScene(
            "lavaScene"
          ) as LavaScene;
          const clientId = lavaScene.socket.id;
          const tx = await p2eGameContract.addPlayerToGameSession(clientId);
          console.log(tx);
          const receipt = await tx.wait();
          console.log(receipt);
        } catch (e) {
          console.log(e);
        }
      }
    };

    const button = createButton(
      this,
      null,
      null,
      {
        defaultImageName: "button2",
        hoverImageName: "button3",
        clickImageName: "button1",
        label: "Add To Game",
      },
      async () => {
        await addPlayer();
        events.emit("playerAdded");
        button.destroy();
      }
    );
  }
}
