import { Scene } from "phaser";
import { createButton } from "../elements/ui/CustomButton";
import { getP2EGameContract } from "../../../support/eth";
import { sharedInstance as events } from "../EventCenter";
import { CustomGameScene } from "../SocketClient";

export default class Dialog extends Scene {
  dialogBackground!: Phaser.GameObjects.Graphics;
  dialogTitle!: Phaser.GameObjects.Text;
  dialogText!: Phaser.GameObjects.Text;
  leaderboardBackground!: Phaser.GameObjects.Graphics;
  leaderboardTitle!: Phaser.GameObjects.Text;
  addToGameBtn!: Phaser.GameObjects.Container;

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
    this.load.image("placeholder", "assets/placeholder.png");
  }

  create() {
    const screenCenterX = this.game.renderer.width / 2;

    this.dialogTitle = this.add
      .text(screenCenterX, 330, "", {
        fontFamily: "Splatch",
      })
      .setFontSize(20)
      .setOrigin(0.5)
      .setDepth(1.1)
      .setAlpha(0);

    this.dialogText = this.add
      .text(screenCenterX, 300, "", {
        fontFamily: "Splatch",
        color: "#ffffff",
      })
      .setFontSize(20)
      .setOrigin(0.5)
      .setDepth(1.1)
      .setAlpha(0);

    this.leaderboardTitle = this.add
      .text(screenCenterX, 270, "", {
        fontFamily: "Splatch",
      })
      .setFontSize(20)
      .setOrigin(0.5)
      .setDepth(1.1)
      .setAlpha(0);

    this.leaderboardBackground = this.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect((this.game.renderer.width - 500) / 2, 220, 500, 300, 32)
      .fillStyle(0xf7bc27, 1)
      .fillRoundedRect((this.game.renderer.width - 480) / 2, 230, 480, 280, 32)
      .setAlpha(0);

    this.dialogBackground = this.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRoundedRect((this.game.renderer.width - 500) / 2, 220, 500, 230, 32)
      .fillStyle(0xf7bc27, 1)
      .fillRoundedRect((this.game.renderer.width - 480) / 2, 230, 480, 210, 32)
      .setAlpha(0);

    const handleButtonClick = async () => {
      try {
        this.addToGameBtn.setAlpha(0);
        this.addToGameBtn.disableInteractive();
        this.dialogBackground.setAlpha(1);
        this.dialogText.setText("").setAlpha(0);
        this.dialogTitle.setText("Checking...").setAlpha(1);
        await addPlayer();
        this.dialogText.setAlpha(0);
        this.dialogTitle.setAlpha(0);
        this.dialogBackground.setAlpha(0);
        events.emit("playerAdded");
      } catch (err) {
        console.log(err);
        this.addToGameBtn.disableInteractive();
        this.dialogBackground.setAlpha(0);
        this.addToGameBtn.setAlpha(0);
        this.dialogText.setText("").setAlpha(0);
        this.dialogTitle.setAlpha(0);
      }
    };

    this.addToGameBtn = createButton(
      this,
      null,
      380,
      {
        defaultImageName: "button2",
        hoverImageName: "button3",
        clickImageName: "button1",
        label: "Add To Game",
      },
      handleButtonClick
    ).setAlpha(0);

    const addPlayer = async () => {
      const { ethereum } = window;
      const p2eGameContract = getP2EGameContract(ethereum);
      if (p2eGameContract) {
        try {
          const currentLevelScene = this.scene.manager.getScene(
            "currentLevel"
          ) as CustomGameScene;
          const clientId = currentLevelScene.socketClient.socket.id;
          const tx = await p2eGameContract.addPlayerToGameSession(clientId);
          await tx.wait();
        } catch (e) {
          console.log(e);
        }
      }
    };

    events.on("gameState", async (state: string) => {
      this.leaderboardBackground.setAlpha(0);
      this.leaderboardTitle.setAlpha(0);
      this.leaderboardTitle.setAlpha(0);
      this.dialogBackground.setAlpha(1);
      switch (state) {
        case "newGame":
          this.addToGameBtn.setInteractive();
          this.addToGameBtn.setAlpha(1);
          this.dialogText
            .setText("Add yourself to the next\navailable game")
            .setAlign("center")
            .setAlpha(1);
          break;
        case "gameTimeout":
          this.dialogText
            .setText("Out of time!\nNobody wins\nWaiting for next game")
            .setAlign("center")
            .setAlpha(1);
        default:
          break;
      }
    });

    const loadImages = (leaderBoard: any[]) => {
      const imageData = new Map<string, Phaser.GameObjects.Image>();
      const basePosition = 300;
      const increment = 30;
      leaderBoard.map((data: any, index) => {
        const adjusted = index + 1;
        const image = this.add.image(
          (this.game.renderer.width - 500) / 2 + 120,
          basePosition + increment * adjusted,
          "placeholder"
        );
        image.setDisplaySize(30, 30);
        imageData.set(data.playerAddress, image);
        this.load.image(data.playerAddress, data.image);
        this.add
          .text(
            (this.game.renderer.width - 500) / 2 + 160,
            280 + increment * adjusted,
            `${adjusted}: ${data.playerAddress} : ${data.count}`,
            {
              fontFamily: "Splatch",
            }
          )
          .setFontSize(18)
          .setDepth(1.1);
      });

      this.load.once("complete", () => {
        // texture loaded so use instead of the placeholder
        console.log("image loaded!");
        imageData.forEach((image, key) => {
          image.setTexture(key);
        });
      });

      this.load.once("loadError", (data: any) => {
        console.log("err: ", { data });
      });

      this.load.start();
    };

    events.on("leaderBoard", (gameData: { leaderBoard: any[] }) => {
      console.log("leaderBoard: ", { gameData });
      const { leaderBoard } = gameData;
      loadImages(leaderBoard);
      this.addToGameBtn.setAlpha(0);
      this.dialogTitle.setAlpha(0);
      this.dialogText.setAlpha(0);
      this.dialogBackground.setAlpha(0);
      this.leaderboardBackground.setAlpha(1);
      this.leaderboardTitle.setText("Leaderboard").setAlpha(1);
    });

    events.on(
      "awaitingResults",
      ({
        winners,
        playerIsWinner,
      }: {
        winners: boolean;
        playerIsWinner: boolean;
      }) => {
        const text = winners
          ? playerIsWinner
            ? "You Won!\nAwaiting Results.."
            : "You Lost\nAwaiting Results.."
          : "No winners this time\nWaiting for next game";
        this.dialogBackground.setAlpha(1);
        this.dialogTitle.setText(text).setAlign("center").setAlpha(1);
      }
    );
  }
}
