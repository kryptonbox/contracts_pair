const GnosisWallet = artifacts.require('./GnosisWallet')
const Timelock = artifacts.require('./Timelock')
const SashimiToken = artifacts.require('./SashimiToken')
const MockERC20 = artifacts.require('./MockERC20')
const WETH9 = artifacts.require('./WETH9.sol')
const MasterChef = artifacts.require('./MasterChef')
const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
// const Migrator = artifacts.require('Migrator');
// const UniswapV2Migrator = artifacts.require('UniswapV2Migrator');

const Web3 = require('web3');
const web3 = new Web3();
const web3ToWei = (amount) => web3.utils.toWei((amount).toString(), "ether");

module.exports = function (deployer, network, accounts) {
    const DEV = accounts[0]; 
    const VESTING = accounts[1];
    deployer.then(async () => {
        try {
            // DEPLOY MULTISIG WALLET - SASHIMI & MOCK TOKENS
            await deployer.deploy(GnosisWallet, [DEV, VESTING, GOVERNANCE], 2); 
            await deployer.deploy(Timelock, DEV, 172800);
            await deployer.deploy(SashimiToken).deployed() 
            await deployer.deploy(MockERC20); 
            await deployer.deploy(WETH9);
            const GnosisWalletInstance = await GnosisWallet.deployed(); console.log(`GnosisWalletInstance: ${GnosisWalletInstance.address}`);
            const TimelockInstance = await Timelock.deployed(); console.log(`TimelockInstance: ${TimelockInstance.address}`);
            const SashimiTokenInstance = await SashimiToken.deployed(); console.log(`SashimiTokenInstance: ${SashimiTokenInstance.address}`)
            const MockERC20Instance = await MockERC20.deployed(); console.log(`MockERC20Instance: ${MockERC20Instance.address}`)
            const WETH9Instance = await WETH9.deployed(); console.log(`WETH9Instance: ${WETH9Instance.address}`)
            const MasterChefInstance = await MasterChef.deployed(); console.log(`MasterChefInstance: ${MasterChefInstance.address}`);
        
            // DEPLOY MASTERCHEF
            await deployer.deploy(MasterChef, SashimiTokenInstance.address, '100', '21093333', '21093777'); 
        
            // SET TIMELOCK MULTISIG ADMIN
            await TimelockInstance.setPendingAdmin(GnosisWalletInstance.address, { from: DEV });

            // INITIAL SASHIMI
            console.log(`Balance SASHIMI DEV before: ${await SashimiTokenInstance.balanceOf(DEV)}`)
            await SashimiTokenInstance.mint(DEV, web3ToWei(1000000), { from: DEV }) // - TESTING
            await SashimiTokenInstance.mint(VESTING, web3ToWei(1000000), { from: DEV }) // - TESTING
            await MockERC20Instance.mint(DEV, web3ToWei(1000000), { from: DEV }) // - TESTING
            await MockERC20Instance.mint(VESTING, web3ToWei(1000000), { from: DEV }) // - TESTING
            console.log(`Balance SASHIMI DEV after: ${await SashimiTokenInstance.balanceOf(DEV)}`)

            // TRANSFER OWNERSHIP TO MASTERCHEF
            await SashimiTokenInstance.transferOwnership(MasterChefInstance.address, { from: DEV });
            await MockERC20Instance.transferOwnership(MasterChefInstance.address, { from: DEV });

            let UniswapV2FactoryInstance;
            let SASHIMI_ETH, MOCKERC20_ETH, TOGETHER
            if (network == 'kovan') {

                // CREATE UNISWAP FACTORY CONTRACT
                const UniswapV2FactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
                UniswapV2FactoryInstance = await UniswapV2Factory.at(UniswapV2FactoryAddress);
            
                // CREATE 3 POOLS - First Pool > Sashimi-Weth
                SASHIMI_ETH = await UniswapV2Pair.at((await UniswapV2FactoryInstance.createPair(SashimiTokenInstance.address, WETH9Instance.address)).logs[0].args.pair);
                await SashimiTokenInstance.transfer(SASHIMI_ETH.address, '10000000000000000000', { from: DEV }); // 10 SUSHI
                await WETH9Instance.transfer(SASHIMI_ETH.address, '1000000000000000', { from: DEV }); // 0.001 WETH
                await SASHIMI_ETH.mint(DEV);
                console.log(`SUSHI_WETH Address: ${SASHIMI_ETH.address}`);

                // Second Pool > MockERC20-Weth
                MOCKERC20_ETH = await UniswapV2Pair.at((await UniswapV2FactoryInstance.createPair(MockERC20Instance.address, WETH9Instance.address)).logs[0].args.pair);
                await MockERC20Instance.transfer(MOCKERC20_ETH.address, '10000000000000000000', { from: DEV }); // 10 MOCKERC20
                await WETH9Instance.transfer(MOCKERC20_ETH.address, '1000000000000000', { from: DEV }); // 0.001 WETH
                await MOCKERC20_ETH.mint(DEV);
                console.log(`MOCKERC20_WETH Address: ${MOCKERC20_ETH.address}`)
            
                // Third Pool > Sashimi-MockERC20
                TOGETHER = await UniswapV2Pair.at((await UniswapV2FactoryInstance.createPair(SashimiTokenInstance.address, MockERC20Instance.address)).logs[0].args.pair);
                await MockERC20Instance.transfer(TOGETHER.address, '10000000000000000000', { from: DEV }); // 10 MOCKERC20
                await SashimiTokenInstance.transfer(TOGETHER.address, '10000000000000000000', { from: DEV }); // 10 SUSHI
                await TOGETHER.mint(DEV);
                console.log(`MOCKERC20_SUSHI Address: ${TOGETHER.address}`)

                await MasterChefInstance.add('2000', SASHIMI_ETH.address, true);
                await MasterChefInstance.add('3000', MOCKERC20_ETH.address, true);
                await MasterChefInstance.add('5000', TOGETHER.address, true);
            }
        
            console.log(`Successfully deployed the project to ${network}. `)

        } catch (e) {
            console.log(e);
        }

    })
}