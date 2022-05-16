import "phaser";
import { createButton } from "../elements/ui/CustomButton";

export default class MainMenu extends Phaser.Scene {
  preload() {
    this.load.image("volcano_bg", "assets/volcano_bg.png");
    this.load.image("logo", "assets/logo.png");
    this.load.image("button1", "assets/ui/blue_button01.png");
    this.load.image("button2", "assets/ui/blue_button02.png");
    this.load.image("button3", "assets/ui/blue_button03.png");
  }

  create() {
    this.add.image(0, 0, "volcano_bg").setOrigin(0);
    this.add.image(
      this.game.renderer.width / 2 - 10,
      this.game.renderer.height * 0.35,
      "logo"
    );

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
