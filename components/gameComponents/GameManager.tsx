import { useEffect } from "react";
import "phaser";
import UI from "./scenes/UIScene";
import LavaScene from "./scenes/LavaScene";
import ConstructionScene from "./scenes/ConstructionScene";
import MainMenu from "./scenes/MainMenuScene";
import Dialog from "./scenes/DialogScene";

let game: Phaser.Game;

const GAME_WIDTH = 1280;

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
      width: GAME_WIDTH,
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
        game.scale.resize(GAME_WIDTH, window.innerHeight);
      },
      false
    );

    const availableLevels = {
      lava: LavaScene,
      construction: ConstructionScene,
    };

    const getLevel = async (): Promise<"lava" | "construction"> => {
      try {
        const res = await fetch("/api/currentLevel");
        const data = await res.json();
        return data.level;
      } catch (err) {
        console.log(err);
        throw err;
      }
    };

    const level = await getLevel();
    console.log("loading level: ", level);
    game.scene.add("main", MainMenu);
    game.scene.add("lavaScene", LavaScene);
    game.scene.add("constructionScene", ConstructionScene);
    game.scene.add("currentLevel", availableLevels[level]);
    game.scene.add("ui", UI);
    game.scene.add("dialog", Dialog);
    game.scene.start("currentLevel");
  };

  return null;
};

export default GameManager;
