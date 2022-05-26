import { Fragment, useEffect, useState } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { BellIcon, MenuIcon, XIcon } from "@heroicons/react/outline";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { getGameNFTTokenContract, toIpfsGatewayURL } from "../support/eth";
import { getNFTTokenMetadata } from "../support/nftToken";

const navigation = [
  { name: "Play ", href: "game", current: false },
  { name: "What's COOL?", href: "cool", current: false },
  { name: "Credits", href: "credits", current: false },
];

const userNavigation = [{ name: "Disconnect", href: "#" }];
const DEFAULT_AVATAR_IMAGEURL = "/assets/avatar.png";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Navbar = ({ currentPageHref }: { currentPageHref: string }) => {
  const { data: account } = useAccount();
  const [avatarImageUrl, setAvatarImageUrl] = useState(DEFAULT_AVATAR_IMAGEURL);
  const [hasNFT, setHasNFT] = useState(false);

  useEffect(() => {
    const getNFTTokens = async () => {
      if (account && account.address) {
        const { ethereum } = window;
        const metadata = await getNFTTokenMetadata(ethereum, account.address);
        if (metadata) {
          const imageUrl = toIpfsGatewayURL(metadata.image);
          setAvatarImageUrl(imageUrl);
        }
      } else {
        setAvatarImageUrl(DEFAULT_AVATAR_IMAGEURL);
      }
    };
    getNFTTokens();
  }, [account, hasNFT]);

  useEffect(() => {
    const { ethereum } = window;
    const gameNFTTokenContract = getGameNFTTokenContract(ethereum);
    if (!gameNFTTokenContract) {
      return;
    }

    gameNFTTokenContract.on(
      "Transfer",
      (from: string, to: string, tokenId: number) => {
        console.log("Transfer", from, to, tokenId);
        if (to === account?.address) {
          setHasNFT(true);
        }
      }
    );

    return () => {
      gameNFTTokenContract.removeAllListeners("Transfer");
    };
  }, [account]);

  navigation.map((nav) => {
    if (nav.href === currentPageHref) {
      nav.current = true;
    } else {
      nav.current = false;
    }
  });
  return (
    <Disclosure as="nav" className="bg-gray-900">
      {({ open }) => (
        <>
          <div className="px-4 mx-auto border-b border-gray-500 max-w-7xl sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex items-center mr-2 -ml-2 md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 text-gray-400 rounded-md hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XIcon className="block w-6 h-6" aria-hidden="true" />
                    ) : (
                      <MenuIcon className="block w-6 h-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <a href="/">
                    <img
                      className="block w-auto h-10 lg:hidden"
                      src="/assets/coollink_avatar.png"
                      alt="Coollink"
                    />
                    <div className="hidden w-auto text-2xl text-yellow-500 lg:block font-splatch">
                      COOLLINK!
                    </div>
                  </a>
                </div>
                <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        item.current
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "px-3 py-2 rounded-md text-sm font-medium font-splatch"
                      )}
                      aria-current={item.current ? "page" : undefined}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ConnectButton />
                </div>
                <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex text-sm bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                        <span className="sr-only">Open user menu</span>
                        <div className="flex items-center justify-center bg-white rounded-full w-9 h-9">
                          <img
                            className="w-8 h-8 rounded-full"
                            src={avatarImageUrl}
                            alt=""
                          />
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 w-48 py-1 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <a
                                href={item.href}
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "block px-4 py-2 text-sm text-gray-700"
                                )}
                              >
                                {item.name}
                              </a>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "block px-3 py-2 rounded-md text-base font-medium"
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="flex items-center px-5 sm:px-6">
                <div className="flex-shrink-0">
                  <img
                    className="w-10 h-10 rounded-full"
                    src={avatarImageUrl}
                    alt=""
                  />
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 p-1 ml-auto text-gray-400 bg-gray-800 rounded-full hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
              <div className="px-2 mt-3 space-y-1 sm:px-3">
                {userNavigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className="block px-3 py-2 text-base font-medium text-gray-400 rounded-md hover:text-white hover:bg-gray-700"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
