var Web3 = require('web3')
const artifact = require('./build/contracts/PancakePair.json')
const initCodeHash = Web3.utils.keccak256(artifact.bytecode)
console.log('initCodeHash: ', initCodeHash)
// dd7bfa8eaa5c856122dda3cd9a9b56040c1b070ebc5c5f1d967cb1b52159e264