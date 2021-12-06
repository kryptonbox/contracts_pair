const Multicall = artifacts.require("Multicall");

module.exports = function(deployer) {
    deployer.then(async () => {
        let multicall = await deployer.deploy(Multicall);
        console.log(multicall.address);
    });
};
