// Imports
require('dotenv').config();
const fs     = require('fs');
const axios  = require('axios');
const ethers = require("ethers");
const args   = require('minimist')(process.argv.slice(2));

const DELAY_IN_MS = args['delay'] || 1000 // 1 second throttle to avoid exceeding request limit
const WAIT        = args['wait'] || false; // monitor a boolean that indicates contract is open

// Token Info
const MINT_AMOUNT          = args['amount'] || 1;
const MINT_PRICE           = args['price']  || 0.069;
const MAX_GAS_GWEI         = args['maxGas'] || 1000;
const TIP_GWEI             = args['tip'] || 50
const TOTAL_COST           = MINT_AMOUNT * MINT_PRICE;
const mintMethodName       = args['mintMethod'] || 'mint';
const isSaleOpenMethodName = args['watchMethod'] || 'saleActive';

// Botting wallet
const PRIVATE_KEY = args['privKey'] || process.env.PRIVATE_KEY;
const provider    = new ethers.providers.WebSocketProvider(process.env.RPC_URI);
const wallet      = new ethers.Wallet(PRIVATE_KEY, provider);
const GAS_API_KEY = process.env.GAS_API_KEY;
const fallbackAbi = 
  [
    {
      inputs: [{ internalType: "uint256", name: "numberOfMints", type: "uint256" }],
      name: "mint",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "saleActive",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function"
    }
  ];

// Script
async function main() {
  lineBreak("STARTING MINT BOT");
  await getContractABI();
  const contract = getContract();
  if (WAIT === 'true') {
    await waitForPublicSale(contract);
  }

  while (true && isValidTransaction(contract)) {
    await mintToken(contract);
    await new Promise(resolve => setTimeout(resolve, DELAY_IN_MS));
  }
}

async function waitForPublicSale(contract) {
  let waiting = true;
  let count = 0;
  while (waiting) {
    waiting = await isClosed(contract);
    if (waiting && count == 0) {
      console.log('\nBot waiting for contract to be open to public. Please wait...');
    }
    count++;
    await new Promise(resolve => setTimeout(resolve, DELAY_IN_MS));
  }
  lineBreak("CONTRACT OPENED TO PUBLIC");
}

function lineBreak(header) {
  console.log(`-----------------------${header}-----------------------`);
}

async function isClosed(contract) {
  try {
    const response = await contract[isSaleOpenMethodName]();
    return !(response);
  } catch (e) {
    console.log('ERROR: Unable to spy on contract. ' + e.message);
    process.exit(0);
  }
}

function getContract() {
  const abi = fs.readFileSync('./src/abi.json', 'utf-8');
  let contract;
  try {
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);
  } catch (e) {
    console.log("\nERROR: ABI may not exist, falling back to custom ABI " + e);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, fallbackAbi, wallet);
  }
  return contract.connect(wallet);
}

async function getContractABI() {
  const url = `http://etherscan.io/api?module=contract&action=getabi&address=${process.env.CONTRACT_ADDRESS}`;
  const response = await axios.get(url);
  fs.writeFileSync('./src/abi.json', response.data.result);
}

// Gas estimator via ethgasstation.info API call, alternatively use provider.getGasPrice
async function getGasPrice() {
  const url = 'https://ethgasstation.info/json/ethgasAPI.json';
  let fastestBaseFee = TIP_GWEI;
  try {
    const response = await axios.get(url);
    fastestBaseFee += response.data.fastest / 10;
  } catch (exception) {
    process.stderr.write(`ERROR received from ${url}: ${exception}\n`);
  }
  console.log(`Attempting Total Gas: ${fastestBaseFee} GWEI`)
  return fastestBaseFee;
}

async function getGasPriceNew() {
  console.log(GAS_API_KEY);
  axios.defaults.headers.get['Content-Type'] = 'application/json';
  const url = 'https://api.blocknative.com/gasprices/blockprices?confidenceLevels=99';
  const response = await axios.get(url, {
    headers: {
      'Authorization': `${GAS_API_KEY}`
    }
  }).catch((error) => {
    process.stderr.write(`Error received from ${url}: ${error}\n`);
  });
  return response.data.blockPrices[0].estimatedPrices[0];
}

main();