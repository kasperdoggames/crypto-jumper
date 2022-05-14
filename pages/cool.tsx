import type { NextPage } from "next";
import Head from "next/head";
import Navbar from "../components/Navbar";

const Cool: NextPage = () => {
  return (
    <div className="bg-gray-900">
      <div className="container h-full mx-auto max-w-7xl">
        <Head>
          <title>Crypto Jumper</title>
        </Head>
        <Navbar currentPageHref="cool" />
        <div className="flex flex-col items-center h-screen bg-gray-900">
          <h1 className="py-8 text-2xl text-white font-splatch">
            Powered by $COOL
          </h1>
          <div className="px-8 space-y-8">
            <p className="text-4xl text-white font-koalafamily">
              $COOL sits at the core of everything in Coollink. As the universe
              grows more utility will be added.
            </p>
            <p className="text-4xl text-white font-koalafamily">
              Yield Every Genesis Coollink yields 10 $COOL a day. Use it to play
              and win more $COOL.
            </p>
            <p className="text-4xl text-white font-koalafamily">
              With 1 $COOL , you can battle to be the first to the top of the
              platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cool;
