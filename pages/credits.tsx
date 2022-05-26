import type { NextPage } from "next";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Credits: NextPage = () => {
  return (
    <div className="bg-gray-800">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col h-screen">
          <Head>
            <title>Crypto Jumper</title>
          </Head>
          <Navbar currentPageHref="credits" />
          <div className="flex-1 overflow-auto bg-gray-900">
            <div className="flex flex-col items-center font-splatch">
              <h1 className="py-8 text-2xl text-white">Credits</h1>
              <p className="text-4xl text-center text-white font-koalafamily">
                Thanks to the following:
              </p>
              <div className="w-full lg:w-2/3 p-8">
                <div className="grid grid-cols-2 gap-6 text-white text-xs lg:text-sm">
                  <div className="text-center text-indigo-500">
                    <p>Lava Level Artwork</p>
                  </div>
                  <div className="text-center">
                    <a
                      className="hover:text-gray-400"
                      href="https://www.ludicarts.com/free-volcano-platform-tileset/"
                    >
                      www.ludicarts.com
                    </a>
                  </div>
                  <div className="text-center text-indigo-500">
                    <p>Lava Level Music</p>
                  </div>
                  <div className="text-center">
                    <a
                      className="hover:text-gray-400"
                      href="https://opengameart.org/content/game-music-loop-rising"
                    >
                      horrorpen
                    </a>
                  </div>
                  <div className="text-center text-indigo-500">
                    <p>Lava Melt SFX</p>
                  </div>
                  <div className="text-center">
                    <a
                      className="hover:text-gray-400"
                      href="https://opengameart.org/content/acid-burn-sounds"
                    >
                      mikhog
                    </a>
                  </div>
                  <div className="text-center text-indigo-500">
                    <p>Finish Bell SFX</p>
                  </div>
                  <div className="text-center">
                    <a
                      className="hover:text-gray-400"
                      href="https://freesound.org/people/daytripper/sounds/73678/"
                    >
                      daytripper
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Credits;
