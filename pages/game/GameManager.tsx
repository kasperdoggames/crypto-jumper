import { useEffect } from "react";
import "phaser";
import UI from "./scenes/UIScene";
import LavaScene from "./scenes/LavaScene";
import MainMenu from "./scenes/MainMenuScene";

let game: Phaser.Game;

const GameManager = () => {
  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    if (typeof window !== "object") {
      return;
    }

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth - 500,
      height: window.innerHeight - 100,
      backgroundColor: "#4488aa",
      physics: {
        default: "matter",
        matter: {
          gravity: { y: 3 }, // This is the default value, so we could omit this

          // Enable debug graphics, so we can see the bounds of each physics
          // object in our scene. Note: this can slow things down, so be sure
          // to turn it off when you aren't debugging
          // debug: true,
        },
      },
      fps: {
        target: 60,
        forceSetTimeOut: true,
      },
      parent: "game",
    };

    if (game) {
      return;
    }

    game = new Phaser.Game(config);
    window.addEventListener(
      "resize",
      () => {
        game.scale.resize(window.innerWidth - 500, window.innerHeight);
      },
      false
    );

    game.scene.add("main", MainMenu);
    game.scene.add("lavaScene", LavaScene);
    game.scene.add("ui", UI);
    game.scene.start("main");
  };

  return null;
};

export default GameManager;
