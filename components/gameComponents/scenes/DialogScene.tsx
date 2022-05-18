import { Scene } from "phaser";
import { createButton } from "../elements/ui/CustomButton";
import { getP2EGameContract } from "../../../support/eth";
import LavaScene from "./LavaScene";
import { sharedInstance as events } from "../EventCenter";

export default class Dialog extends Scene {
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
          await tx.wait();
        } catch (e) {
          console.log(e);
        }
      }
    };

    events.on("newGame", () => {
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
          try {
            await addPlayer();
            events.emit("playerAdded");
            button.destroy();
          } catch (err) {
            console.log(err);
          }
        }
      );
    });

    events.on("leaderBoard", (gameData: any) => {
      console.log("leaderBoard: ", { gameData });
      const { width, height } = this.sys.game.canvas;
      const bg = this.add
        .rectangle(0, 0, width, height, 0x000000, 0.8)
        .setOrigin(0);
      const box = this.add
        .rectangle(this.game.renderer.width / 2, 300, 800, 400, 0xd0d0d0)
        .setDepth(1);
      const title = this.add
        .text(this.game.renderer.width / 2, 120, "Leaderboard", {
          fontFamily: "Splatch",
        })
        .setOrigin(0.5)
        .setDepth(1.1);

      const dataText = this.add
        .text(this.game.renderer.width / 2, 200, "1: Player 1\n2: Player 2", {
          fontFamily: "Splatch",
        })
        .setOrigin(0.5)
        .setDepth(1.1);
    });
  }
}
