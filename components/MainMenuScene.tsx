import "phaser";

export default class MainMenu extends Phaser.Scene {
  preload() {
    this.load.image("volcano_bg", "assets/volcano_bg.png");
    this.load.image("logo", "assets/logo.png");
  }

  create() {
    this.add.image(0, 0, "volcano_bg").setOrigin(0);
    this.add.image(
      this.game.renderer.width / 2 - 10,
      this.game.renderer.height * 0.35,
      "logo"
    );

    const playButton = this.add.text(
      this.game.renderer.width / 2 - 50,
      this.game.renderer.height * 0.7,
      "< Play >",
      {
        fontSize: "250%",
      }
    );

    playButton.setInteractive();

    playButton.on("pointerover", () => {
      playButton
        .setFont("280%")
        .setPosition(
          this.game.renderer.width / 2 - 60,
          this.game.renderer.height * 0.7
        );
    });

    playButton.on("pointerout", () => {
      playButton
        .setFont("250%")
        .setPosition(
          this.game.renderer.width / 2 - 50,
          this.game.renderer.height * 0.7
        );
    });

    playButton.on("pointerup", () => {
      this.scene.start("lavaScene");
    });
  }

  update() {}
}
