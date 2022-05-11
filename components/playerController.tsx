import "phaser";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { StateMachine } from "./StateMachine";

export class PlayerController {
  sprite!: Phaser.Physics.Matter.Sprite;
  stateMachine!: StateMachine;
  speed = 4;
  jumpSpeed = -20;
  controls: Phaser.Types.Input.Keyboard.CursorKeys;
  isTouchingGround = false;
  spriteY?: number;
  jumpCount = 0;
  scene: Phaser.Scene;
  socket!: Socket<DefaultEventsMap, DefaultEventsMap>;

  constructor(scene: any) {
    this.scene = scene;
    this.socket = scene.socket;

    // create a player instance from the spritesheet
    this.sprite = scene.matter.add
      .sprite(0, 0, "coolLink", "run_01.png")
      .setFixedRotation();

    // add a name for the player
    this.sprite.setName("coolLink");

    this.createAnims();
    this.controls = scene.cursors;
    this.stateMachine = new StateMachine(
      "idle",
      {
        idle: this.idleState,
        run: this.runState,
        jump: this.jumpState,
        melt: this.meltState,
      },
      [this]
    );
  }

  // Create animations
  createAnims() {
    this.scene.anims.create({
      key: "melt",
      frameRate: 18,
      frames: this.sprite.anims.generateFrameNames("coolLink", {
        start: 1,
        end: 12,
        prefix: "Melt_00",
        suffix: ".png",
        zeroPad: 2,
      }),
    });
    this.scene.anims.create({
      key: "run",
      frameRate: 20,
      frames: this.sprite.anims.generateFrameNames("coolLink", {
        start: 1,
        end: 12,
        prefix: "run_",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    this.scene.anims.create({
      key: "idle",
      frameRate: 20,
      frames: this.sprite.anims.generateFrameNames("coolLink", {
        start: 1,
        end: 12,
        prefix: "idle_",
        suffix: ".png",
        zeroPad: 2,
      }),
      repeat: -1,
    });
    this.scene.anims.create({
      key: "jump",
      frames: [{ key: "coolLink", frame: "run_05.png" }],
      repeat: 0,
    });
    this.scene.anims.create({
      key: "doublejump",
      frames: [{ key: "coolLink", frame: "run_06.png" }],
      repeat: 0,
    });
    this.scene.anims.create({
      key: "fall",
      frames: [{ key: "coolLink", frame: "run_10.png" }],
      repeat: 0,
    });
  }

  // set states for state machine
  idleState = {
    enter: () => {
      this.sprite.setVelocity(0);
      this.sprite.anims.play("idle");
      this.socket.emit("playerUpdate", {
        state: "idle",
        location: this.sprite.body.position,
      });
    },
    execute: () => {
      const { space, left, right } = this.controls;
      if (space.isDown && this.isTouchingGround) {
        this.stateMachine.transition("jump");
        return;
      }

      if (left.isDown || right.isDown) {
        this.stateMachine.transition("run");
        return;
      }
    },
  };

  meltState = {
    enter: () => {
      this.sprite.setVelocity(0);
      this.socket.emit("playerUpdate", {
        state: "melt",
        location: this.sprite.body.position,
      });
      this.sprite.anims.play("melt").on("animationcomplete", () => {
        this.socket.emit("dead");
        this.scene.scene.restart();
      });
    },
    execute: () => {},
  };

  runState = {
    enter: () => {
      this.sprite.anims.play("run");
      this.socket.emit("playerUpdate", {
        state: "run",
        location: this.sprite.body.position,
        flipX: this.sprite.flipX,
      });
    },
    execute: () => {
      const { space, left, right } = this.controls;
      if (space.isDown && this.isTouchingGround) {
        this.stateMachine.transition("jump");
        return;
      }

      if (left.isDown) {
        this.sprite.setVelocityX(-this.speed);
        this.sprite.flipX = true;
      } else if (right.isDown) {
        this.sprite.setVelocityX(this.speed);
        this.sprite.flipX = false;
      }
      this.socket.emit("playerUpdate", {
        state: "run",
        location: this.sprite.body.position,
        flipX: this.sprite.flipX,
      });
      if (!(left.isDown || right.isDown)) {
        this.stateMachine.transition("idle");
        return;
      }
    },
  };

  jumpState = {
    enter: () => {
      this.spriteY = this.sprite.y;
    },
    execute: () => {
      const { space, left, right } = this.controls;
      const jumpPressed = Phaser.Input.Keyboard.JustDown(space);
      const animation = this.jumpCount === 1 ? "jump" : "doublejump";
      if (jumpPressed && (this.isTouchingGround || this.jumpCount < 2)) {
        this.sprite.setVelocityY(this.jumpSpeed);
        this.sprite.anims.play(animation, true);
        this.isTouchingGround = false;
        this.jumpCount++;
      }
      // check height of jump for correct animation to play
      if (this.spriteY && this.sprite.y < this.spriteY) {
        this.spriteY = this.sprite.y;
        this.sprite.anims.play(animation, true);
      } else if (this.spriteY && this.sprite.y > this.spriteY) {
        this.spriteY = this.sprite.y;
        this.sprite.anims.play("fall", true);
      }
      // allow movement in the air
      if (left.isDown) {
        this.sprite.setVelocityX(-this.speed);
        this.sprite.flipX = true;
      } else if (right.isDown) {
        this.sprite.setVelocityX(this.speed);
        this.sprite.flipX = false;
      }
      this.socket.emit("playerUpdate", {
        state: "jump",
        location: this.sprite.body.position,
        flipX: this.sprite.flipX,
      });
      if (this.isTouchingGround) {
        this.jumpCount = 0;
        this.stateMachine.transition("idle");
      }
    },
  };
}
