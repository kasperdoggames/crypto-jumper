import { Scene } from "phaser";
import { createButton } from "../elements/ui/CustomButton";
import { getP2EGameContract } from "../../../support/eth";
import LavaScene from "./LavaScene";
import { sharedInstance as events } from "../EventCenter";

export default class Dialog extends Scene {
  title!: Phaser.GameObjects.Text;
  bg!: Phaser.GameObjects.Rectangle;
  dialogBox!: Phaser.GameObjects.Graphics;
  addToGameBtn!: Phaser.GameObjects.Container;
  dialogText!: Phaser.GameObjects.Text;

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
    const { width, height } = this.sys.game.canvas;

    const screenCenterX = this.game.renderer.width / 2;
    const screenCenterY = this.game.renderer.height / 2;

    this.bg = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setAlpha(0);

    this.title = this.add
      .text(screenCenterX, 120, "", {
        fontFamily: "Splatch",
      })
      .setOrigin(0.5)
      .setDepth(1.1)
      .setAlpha(0);

    this.dialogText = this.add
      .text(screenCenterX, 240, "", {
        fontFamily: "Splatch",
      })
      .setOrigin(0.5)
      .setDepth(1.1)
      .setAlpha(0);

    this.dialogBox = this.add
      .graphics()
      .fillStyle(0xd0d0d0, 1)
      .fillRoundedRect((this.game.renderer.width - 800) / 2, 150, 800, 400, 32);

    this.addToGameBtn = createButton(
      this,
      null,
      450,
      {
        defaultImageName: "button2",
        hoverImageName: "button3",
        clickImageName: "button1",
        label: "Add To Game",
      },
      async () => {
        try {
          this.addToGameBtn.setAlpha(0);
          this.addToGameBtn.disableInteractive();
          this.dialogBox.setAlpha(0);
          this.dialogText.setText("").setAlpha(0);
          this.title.setText("Checking...").setAlpha(1);
          await addPlayer();
          this.title.setAlpha(0);
          this.bg.setAlpha(0);
          events.emit("playerAdded");
        } catch (err) {
          console.log(err);
          this.addToGameBtn.disableInteractive();
          this.bg.setAlpha(0);
          this.dialogBox.setAlpha(0);
          this.addToGameBtn.setAlpha(0);
          this.dialogText.setText("").setAlpha(0);
        }
      }
    );

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
      this.bg.setAlpha(1);
      this.addToGameBtn.setInteractive();
      this.addToGameBtn.setAlpha(1);
      this.dialogText
        .setText("Add yourself to the next available game")
        .setAlpha(1);
    });

    events.on("leaderBoard", (gameData: { leaderBoard: any[] }) => {
      console.log("leaderBoard: ", { gameData });
      const { leaderBoard } = gameData;
      this.bg.setAlpha(1);
      this.dialogBox.setAlpha(1);
      this.title.setText("Leaderboard").setAlpha(1);
      const output = leaderBoard.map(
        (playerData, index) =>
          `${index + 1}: ${playerData.playerAddress} ${playerData.count}`
      );
      this.add
        .text(screenCenterX, 200, output.join("\n"), {
          fontFamily: "Splatch",
        })
        .setOrigin(0.5)
        .setDepth(1.1);
    });

    events.on("awaitingResults", (isWinner: boolean) => {
      this.bg.setAlpha(1);
      const text = isWinner
        ? "You Won!\nAwaiting Results.."
        : "You Lost\nAwaiting Results..";
      this.title.setText(text).setAlpha(1);
    });
  }
}
