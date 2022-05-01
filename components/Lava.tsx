export const createLava = (scene: Phaser.Scene, x: number, y: number) => {
  const lavapart = scene.add.rectangle(0, 0, 1400, 1040, 0xe4b108);
  const lava = scene.matter.add.sprite(0, 0, "lava");
  lava.setStatic(true);
  lava.setDisplaySize(1400, 240);
  lava.setName("lava");
  lavapart.setName("lava");
  lava.setDepth(1);
  lavapart.setDepth(1);
  lava.anims.create({
    key: "bubble",
    frameRate: 18,
    frames: lava.anims.generateFrameNames("lava", {
      start: 20,
      end: 50,
      prefix: "lava00",
      suffix: ".png",
      zeroPad: 2,
    }),
    repeat: -1,
  });
  lava.anims.play("bubble", true);
  lavapart.setPosition(x, y + 1400);
  lava.setPosition(x, y + 1000);
  return { lava, lavapart };
};
