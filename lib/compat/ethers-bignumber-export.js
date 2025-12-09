// Export BigNumber from ethers shim for ESM imports
const ethers = require('./ethers-providers-shim.js');
module.exports = ethers.BigNumber;

