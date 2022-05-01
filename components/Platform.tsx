export const createPlatform = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  imageName: string
) => {
  const platform = scene.matter.add.image(x, y, imageName);
  platform.setStatic(true);
  platform.setName(imageName);
  return platform;
};

export const moveVertical = (
  scene: Phaser.Scene,
  platform: Phaser.Physics.Matter.Image
) => {
  const startY = platform.y;
  scene.tweens.addCounter({
    from: 0,
    to: -200,
    duration: 1500,
    ease: Phaser.Math.Easing.Sine.InOut,
    repeat: -1,
    yoyo: true,
    onUpdate: (_tween, target) => {
      const destY = startY + target.value;
      const dy = destY - platform.y;
      platform.y = destY;
      platform.setVelocityY(dy);
    },
  });
};

export const moveHorizontal = (
  scene: Phaser.Scene,
  platform: Phaser.Physics.Matter.Image
) => {
  const startX = platform.x;
  scene.tweens.addCounter({
    from: 0,
    to: -200,
    duration: 1500,
    ease: Phaser.Math.Easing.Sine.InOut,
    repeat: -1,
    yoyo: true,
    onUpdate: (_tween, target) => {
      const destX = startX + target.value;
      const dx = destX - platform.x;
      platform.x = destX;
      platform.setVelocityY(dx);
    },
  });
};
