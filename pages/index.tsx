import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";

const Home: NextPage = () => {
  // Dynamic Loader to wait before loaing up the phaser game
  const DynamicLoader = dynamic(() => import("../components/GameManager"), {
    loading: () => <p>Loading...</p>,
    ssr: false,
  });
  return (
    <div>
      <Head>
        <title>Crypto Jumper</title>
      </Head>
      <div className="flex justify-center">
        <div id="game"></div>
        <DynamicLoader />
      </div>
    </div>
  );
};

export default Home;
