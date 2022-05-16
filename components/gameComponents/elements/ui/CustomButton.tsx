export const createButton = (
  scene: Phaser.Scene,
  x: number | null,
  y: number | null,
  {
    defaultImageName,
    hoverImageName,
    clickImageName,
    label,
  }: {
    defaultImageName: string;
    hoverImageName: string;
    clickImageName: string;
    label: string;
  },
  cb: () => void
) => {
  const xLoc = x ? x : scene.game.renderer.width / 2;
  const yLoc = y ? y : scene.game.renderer.height / 2;
  const defaultImage = scene.add.image(0, 0, defaultImageName).setVisible(true);
  const clickImage = scene.add.image(0, 0, clickImageName).setVisible(false);
  const hoverImage = scene.add.image(0, 0, hoverImageName).setVisible(false);

  const buttonLabel = scene.add.text(0, 0, label).setOrigin(0.5);

  const button = scene.add.container(xLoc, yLoc);

  button.add(defaultImage);
  button.add(clickImage);
  button.add(hoverImage);
  button.add(buttonLabel);

  button.setSize(defaultImage.width, defaultImage.height);
  button
    .setInteractive(
      new Phaser.Geom.Rectangle(0, 0, defaultImage.width, defaultImage.height),
      Phaser.Geom.Rectangle.Contains
    )
    .on("pointerup", () => {
      console.log("button pushed");
      cb();
    })
    .on("pointerover", () => {
      hoverImage.setVisible(true);
      defaultImage.setVisible(false);
    })
    .on("pointerout", () => {
      hoverImage.setVisible(false);
      defaultImage.setVisible(true);
    });
  return button;
};
