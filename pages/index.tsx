import type { NextPage } from "next";
import Head from "next/head";
import Navbar from "../components/Navbar";

const Home: NextPage = () => {
  return (
    <div className="bg-gray-900">
      <div className="container h-full mx-auto max-w-7xl">
        <div>
          <Head>
            <title>Crypto Jumper</title>
          </Head>
          <Navbar currentPageHref={"/"} />
          <div className="flex flex-col items-center bg-gray-700">
            <img src="/assets/splash.png" />
            <p className="pt-12 pb-4 text-4xl text-white font-splatch">
              &lt;How to play&gt;
            </p>
            <div className="w-full p-12 space-y-8">
              <div className="flex space-x-8">
                <div className="flex flex-col items-center justify-between pt-4 pb-6 border-4 border-white h-60 w-60 drp drop-shadow-2xl shadow-white bg-violet-600 rounded-xl hover:bg-violet-500">
                  <img
                    className=""
                    src="/assets/coollink_avatar.png"
                    alt="Coollink Avatar"
                  />
                  <div className="text-lg font-bold text-white font-splatch">
                    Mint NFT
                  </div>
                </div>
                <div className="w-1/2 py-4 space-y-8">
                  <p className="text-2xl font-splatch text-violet-600">
                    Step 1
                  </p>
                  <p className="text-lg leading-10 font-splatch text-violet-600">
                    Mint your unique and personal Coollink NFT. Minting your NFT
                    gives you 10 $COOL tokens and access to play.
                  </p>
                </div>
              </div>

              <div className="flex space-x-8">
                <div className="flex flex-col items-center justify-between pt-4 pb-6 bg-yellow-600 border-4 border-white h-60 w-60 drop-shadow-2xl hover:bg-yellow-500 rounded-xl shadow-white">
                  <img
                    className=""
                    src="/assets/cool_token.png"
                    alt="Cool Token"
                  />
                  <div className="text-lg font-bold text-white font-splatch">
                    Stake $COOL
                  </div>
                </div>
                <div className="w-1/2 py-4 space-y-8">
                  <p className="text-2xl text-yellow-600 font-splatch">
                    Step 2
                  </p>
                  <p className="text-lg leading-10 text-yellow-600 font-splatch">
                    Stake $COOL to play the game. Each game costs 1 $COOL token.
                    Owning an NFT yields 1 additional $COOL per hour.
                  </p>
                </div>
              </div>

              <div className="flex space-x-8">
                <div className="flex flex-col items-center justify-between pt-4 pb-6 bg-green-600 border-4 border-white h-60 w-60 drop-shadow-2xl hover:bg-green-500 rounded-xl shadow-white">
                  <img
                    className=""
                    src="/assets/play.png"
                    alt="Coollink Avatar"
                  />
                  <div className="text-lg font-bold text-white font-splatch">
                    Play
                  </div>
                </div>
                <div className="w-1/2 py-4 space-y-8">
                  <p className="text-2xl text-green-600 font-splatch">Step 3</p>
                  <p className="text-lg leading-10 text-green-600 font-splatch">
                    Play against fellow NFT holders in this multiplayer
                    platformer.
                  </p>
                </div>
              </div>

              <div className="flex space-x-8">
                <div className="flex flex-col items-center justify-between pt-4 pb-6 border-4 border-white h-60 w-60 bg-cyan-600 drop-shadow-2xl hover:bg-cyan-500 rounded-xl shadow-white">
                  <img
                    className=""
                    src="/assets/win.png"
                    alt="Coollink Avatar"
                  />
                  <div className="text-lg font-bold text-white font-splatch">
                    Win
                  </div>
                </div>
                <div className="w-1/2 py-4 space-y-8">
                  <p className="text-2xl text-cyan-600 font-splatch">Step 4</p>
                  <p className="text-lg leading-10 text-cyan-600 font-splatch">
                    Winning the round wins you all the staked tokens. No winners
                    within 60 seconds and staked funds go back to the Coollink
                    treasury.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
