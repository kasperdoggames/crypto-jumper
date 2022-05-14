import type { NextPage } from "next";
import Head from "next/head";
import Navbar from "../components/Navbar";

const About: NextPage = () => {
  return (
    <div className="bg-gray-900">
      <div className="container h-full mx-auto max-w-7xl">
        <Head>
          <title>Crypto Jumper</title>
        </Head>
        <Navbar currentPageHref="about" />
        <div className="flex flex-col items-center h-screen bg-gray-900">
          <h1 className="py-8 text-2xl text-white font-splatch">
            About Coollink the Crypto Jumper
          </h1>
          <div className="px-8 space-y-8">
            <p className="text-4xl text-white font-koalafamily">
              Coollink starts as a collection of 1000 unique and randomly
              generated non-fungible tokens (NFTs).
            </p>
            <p className="text-4xl text-white font-koalafamily">Lorem ipsum</p>
            <p className="text-4xl text-white font-koalafamily">Lorem ipsum</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
