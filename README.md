# CoolLink ChainLink Game

## Game Overview

You play as CoolLink in a multiplayer platform game. CoolLink is a personification of the ChainLink logo and is racing to ring the finish bell before anyone else!

CoolLink can jump and double jump to reach higher platforms to avoid melting in lava or dying in other unfortunate ways.

In order to play the game, the user is required to mint a unqiue CoolLink NFT through the web app via the use of MetaMask crypto wallet.

Once the NFT is minted via the smart contract, the user is awarded 10 $cool tokens.
$cool tokens can be staked to play the game (each game requires 1 $cool token). If the user wins the game, they are awarded all staked tokens. If nobody wins, all staked cool tokens are lost.

More information on the smart contracts used to control this can be found [here](https://github.com/kasperdoggames/crypto-jumper/tree/main/hardhat)

## Web Client

The web client is built using [NextJS](https://nextjs.org/), styled with [tailwindcss](https://tailwindcss.com/) and is using a custom [Express](https://expressjs.com/) backend server running on Node V16.

The smart contracts and MetaMask integration are built using [ethers](https://docs.ethers.io/v5/) and [rainbowkit](https://github.com/rainbow-me/rainbowkit)

NFT images are stored vis ipfs using [nft.storage](https://nft.storage/)

## Game Engine

The game mechanics and logic is developed using [Phaser 3.5](https://phaser.io/) and [MatterJS](https://brm.io/matter-js/).

Mulitplayer features are possible via the use of [socket.io](https://socket.io/).

## Getting Started

### Requirements

An `.env.local` file is required in the root folder with the following variables:

```env
ALCHEMY_ID=
SIGNER_WALLET_KEY=
```

### Running the application locally

- `npm i`
- `npm run dev`

## Deployment

The application is hosted on [heroku](https://www.heroku.com/) and is auto deloyed using a GH Actions [workflow](https://github.com/kasperdoggames/crypto-jumper/blob/main/.github/workflows/main.yml)

## Keeper Contract

The contract address that needs to be set via `setKeeper` on P2EGame contract on a new deploy: `0x0D109DEf408375e52706dE8DC4470011C6Daf978`

NFT images on ipfs: `bafybeifme5ivs3kv3nd5wcdsbdf52dbg3nysoty62bxanxj6z36kvlcy3y`
