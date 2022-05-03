export const createCoin = (scene: Phaser.Scene, x: number, y: number) => {
  const coin = scene.matter.add.sprite(x, y, "coin", "coinSpin0001.png", {
    isStatic: true,
    isSensor: true,
  });
  coin.setName("coin");
  coin.setDisplaySize(70, 70);
  coin.anims.create({
    key: "spin",
    frameRate: 10,
    frames: coin.anims.generateFrameNames("coin", {
      start: 1,
      end: 12,
      prefix: "coinSpin00",
      suffix: ".png",
      zeroPad: 2,
    }),
    repeat: -1,
  });
  coin.anims.play("spin", true);
};
