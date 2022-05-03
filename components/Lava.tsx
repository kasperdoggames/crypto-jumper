export const createLava = (scene: Phaser.Scene, x: number, y: number) => {
  const lavaTileSprite = scene.add.tileSprite(
    x,
    y,
    1400,
    70,
    "lavaTileSprites"
  );
  lavaTileSprite.setPosition(x, y);
  lavaTileSprite.setName("lava");
  const lavaSprite = scene.matter.add
    .sprite(x, y, "lavaTileSprites")
    .setVisible(false);

  lavaSprite.setStatic(true);
  lavaSprite.setPosition(x, y + 15);
  lavaSprite.setName("lava");
  lavaSprite.setDisplaySize(1400, 70);
  // this will be hidden but something to get a frame index
  lavaSprite.anims.create({
    key: "run",
    frameRate: 10,
    frames: lavaSprite.anims.generateFrameNames("coin", {
      start: 1,
      end: 4,
      prefix: "coinSpin00",
      suffix: ".png",
      zeroPad: 2,
    }),
    repeat: -1,
  });
  lavaSprite.anims.play("run", true);

  const lavapart = scene.add.rectangle(0, 0, 1400, 1040, 0xfc8801);
  lavapart.setDepth(1);
  lavapart.setName("lava");
  lavapart.setPosition(x, y + 550);
  return { lavaTileSprite, lavaSprite, lavapart };
};
