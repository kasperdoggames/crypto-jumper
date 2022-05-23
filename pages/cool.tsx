import type { NextPage } from "next";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { getNFTTokenMetadata } from "../support/nftToken";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { toIpfsGatewayURL } from "../support/eth";
import Footer from "../components/Footer";

const Cool: NextPage = () => {
  const { data: account } = useAccount();
  const [nftMetadata, setNftMetadata] = useState<any>({});
  useEffect(() => {
    const getNftMetadata = async (ethereum: any, walletAddress: string) => {
      const metadata = await getNFTTokenMetadata(ethereum, walletAddress);
      console.log({ metadata });
      setNftMetadata(metadata);
    };

    if (account && account.address) {
      const { ethereum } = window;
      getNftMetadata(ethereum, account.address);
    }
  }, [account]);

  return (
    <div className="bg-gray-800">
      <div className="container h-screen mx-auto max-w-7xl">
        <Head>
          <title>Crypto Jumper</title>
        </Head>
        <Navbar currentPageHref="cool" />
        <div className="flex flex-col items-center bg-gray-900">
          <h1 className="py-8 text-2xl text-white font-splatch">
            Powered by CoolLink NFTs and $COOL Tokens
          </h1>
          <div className="py-4 text-center">
            <h2 className="pt-4 pb-8 text-xl text-center text-indigo-500 font-splatch">
              Your Personal Coollink NFT
            </h2>
            {nftMetadata && nftMetadata.image ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center bg-white rounded-full w-52 h-52">
                  <img
                    className="w-48 h-48 rounded-full "
                    src={toIpfsGatewayURL(nftMetadata.image)}
                  ></img>
                </div>
                <p className="w-2/3 py-8 text-4xl text-center text-white font-koalafamily">{`"Coollink casually walking on a '${nftMetadata.attributes[0].value}' background wearing super cool '${nftMetadata.attributes[5].value}' eyewear"`}</p>
              </div>
            ) : (
              <p className="text-4xl text-center text-white font-koalafamily">
                You don&apos;t have your very own Coollink NFT yet...what are
                you waiting for!!
              </p>
            )}
          </div>
          <div className="w-2/3 p-8">
            <div className="flex flex-col items-center">
              <h2 className="py-8 text-xl text-indigo-500 font-splatch">
                $COOL Tokens
              </h2>
              <ul className="space-y-4">
                <li className="text-3xl text-white font-koalafamily">
                  $COOL is the core of everything in Coollink. As the universe
                  grows more utility will be added.
                </li>
                <li className="text-3xl text-white font-koalafamily">
                  Every Genesis Coollink NFT yields 1 $COOL per hour.
                </li>
                <li className="text-3xl text-white font-koalafamily">
                  With 1 $COOL you can battle to be the first to the top of the
                  platforms and win more $COOL.
                </li>
                <li className="text-3xl text-white font-koalafamily">
                  $COOL is NOT an investment and has NO economic value.
                </li>
              </ul>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Cool;
