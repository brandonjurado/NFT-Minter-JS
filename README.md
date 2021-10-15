# NFT Minter JS

## Why I made this?

I simply wanted to learn how to interact with Ethereum smart contracts. Inspiration was also drawn from witnessing bots game the minting system of NFT launches. In addition, I was keen to know how it was accomplished.

Perhaps the publicity of this code would encourage developers of NFT projects to implement anti-bot mechanisms so that this repository is rendered useless. We are still early in the Web3 space, let's make it better!

---

## Install

```
$ npm install
```

---

## Setup Configs

```
$ cp .env.public .env
```

After running the command above, update the `.env` file with RPC URI, Contract Address and your wallets private key. Alternatively, you can provide your wallet private key as a command line argument.

---

## How to run NFT Minter JS

```
$ node src/index.js --amount=<NFT_UNITS> --price=<NFT_PRICE> --mintMethod=<MINT_FUNCTION_NAME>--wait=<TRUE/FALSE> --watchMethod=<IS_SALE_OPEN_FUNCTION_NAME> --tip=<TIP_IN_GWEI> --maxGas=<MAX_GAS_IN_GWEI> --delay=<DELAY_IN_MS> --privKey=<WALLET_PRIVATE_KEY>
```

#### Example

```
node src/index.js --wait=true --mintMethod=mint --watchMethod=saleActive --amount=2 --price=0.069
```
