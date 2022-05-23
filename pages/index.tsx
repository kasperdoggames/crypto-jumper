import type { NextPage } from "next";
import Head from "next/head";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const Home: NextPage = () => {
  return (
    <div className="bg-gray-800">
      <div className="container h-full mx-auto max-w-7xl">
        <div>
          <Head>
            <title>Crypto Jumper</title>
          </Head>
          <Navbar currentPageHref={"/"} />
          <div className="flex flex-col items-center bg-gray-900">
            <img src="/assets/splash.png" />
            <p className="pt-12 pb-4 text-3xl text-white font-splatch">
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
                <div className="w-2/3 py-4 space-y-8">
                  <p className="text-xl font-splatch text-violet-600">Step 1</p>
                  <ul className="leading-10 font-splatch text-violet-600">
                    <li>Mint your unique and personal Coollink NFT.</li>{" "}
                    <li>
                      Minting your NFT gives you 10 $COOL tokens and access to
                      play.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-8">
                <div className="flex flex-col items-center justify-between pt-4 pb-6 bg-yellow-600 border-4 border-white h-60 w-60 drop-shadow-2xl hover:bg-yellow-500 rounded-xl shadow-white">
                  <img
                    className=""
                    src="/assets/cool_token.png"
                    alt="Cool Token"
                  />
                  <div className="font-bold text-white font-splatch">
                    Stake $COOL
                  </div>
                </div>
                <div className="w-2/3 py-4 space-y-8">
                  <p className="text-xl text-yellow-600 font-splatch">Step 2</p>
                  <ul className="leading-10 text-yellow-600 font-splatch">
                    <li>Stake $COOL to play the game.</li>{" "}
                    <li>Each game costs 1 $COOL token.</li>
                    <li>Owning an NFT yields 1 additional $COOL per hour.</li>
                  </ul>
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
                <div className="w-2/3 py-4 space-y-8">
                  <p className="text-xl text-green-600 font-splatch">Step 3</p>
                  <ul className="leading-10 text-green-600 font-splatch">
                    <li>
                      Play against fellow NFT holders in this multiplayer
                      platformer.
                    </li>
                    <li>Up to 10 simultaneous players!</li>
                  </ul>
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
                <div className="w-2/3 py-4 space-y-8">
                  <p className="text-xl text-cyan-600 font-splatch">Step 4</p>
                  <ul className="text-lg leading-10 text-cyan-600 font-splatch">
                    <li>Winning the round wins you all staked tokens.</li>{" "}
                    <li>
                      If there are no winners within 60 seconds all funds are
                      lost.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
