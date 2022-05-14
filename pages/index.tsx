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
          <Navbar />
          <div className="flex flex-col items-center h-screen bg-gray-700">
            <div>
              <img src="/assets/logo.png"></img>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
