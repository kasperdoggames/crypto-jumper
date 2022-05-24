# CryptoJumper Contracts

## GameToken

This is the token used to fund players so they can play the game and also the token they receive as their reward.

## GameNFTToken

This is the NFT token contract that holds the NFT that a player needs to own in order to play the game.

## P2EGame

This is the main logic that controls the game through a game loop nudged by Chainlink Keepers.

It manages the staking of funds by players and the settlement of funds once the game finishes. Either a player loses the game and their stake or ,if they win, they get their stake back along with the token staked by any other players in that game session. If no player wins then the contract gets to keep all of the staked tokens.

```

```
