
const Web3 = require("web3");
const web3 = new Web3();
const PancakePair = artifacts.require("PancakePair");
const PancakeFactory = artifacts.require("PancakeFactory");

const admin = "0xF5e9050d47668Bf95B539aAd8641AFF036b0524c"; // bsctest

const WBNB = "0x0A7Bec59B3182068f314EFc2236cCF0c946450a0"; // bsctest

const CAKE = "0xee5e57e356E9EAEcAe242f374Da01838d1E5717d";

const BUSD = "0xbC467d95aEE0D273136F725619fbEd2787D1F45C";

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {

    let currentAccount = accounts[0];

    // CREATE PANCAKE FACTORY CONTRACT
    await deployer.deploy(PancakeFactory, currentAccount, {from: currentAccount});
    const pancakeFactoryInstance = await PancakeFactory.deployed();

    // First Pool > CAKE-BUSD
    let CAKE_BUSD = await PancakePair.at((await pancakeFactoryInstance.createPair(CAKE, BUSD)).logs[0].args.pair);
    // await SashimiTokenInstance.transfer(CAKE_BUSD.address, '10000000000000000000', { from: DEV }); // 10 SUSHI
    // await WETH9Instance.transfer(SASHIMI_ETH.address, '1000000000000000', { from: DEV }); // 0.001 WETH
    // await SASHIMI_ETH.mint(DEV);
    console.log(`SUSHI_WETH Address: ${CAKE_BUSD.address}`);

    // await deployer.deploy(PancakePair);
    // const pair = await PancakePair.deployed();
    // await pair.initialize(WBNB, BUSD);
    // await farming.add("100",USDT_BUSD,false);
  });
};
