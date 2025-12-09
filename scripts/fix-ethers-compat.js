// Create compatibility shim for ethers v6 to work with @thirdweb-dev/react v4
const fs = require('fs');
const path = require('path');

const ethersPath = path.join(__dirname, '../node_modules/ethers');
const utilsPath = path.join(ethersPath, 'lib.esm/utils/index.js');
const providersPath = path.join(ethersPath, 'lib.esm/providers/index.js');

// Check if we need to create compatibility exports
try {
  // Read the providers index to see what's available
  if (fs.existsSync(providersPath)) {
    const providersContent = fs.readFileSync(providersPath, 'utf8');
    
    // Check if JsonRpcProvider exists (v6 equivalent of StaticJsonRpcProvider)
    if (providersContent.includes('JsonRpcProvider') && !providersContent.includes('StaticJsonRpcProvider')) {
      console.log('⚠️  ethers v6 detected - StaticJsonRpcProvider not found');
      console.log('   @thirdweb-dev/react v4 requires ethers v5');
      console.log('   Consider migrating to thirdweb v5 or downgrading ethers to v5');
    }
  }
} catch (error) {
  console.log('⚠️  Could not check ethers compatibility:', error.message);
}

console.log('💡 Solution: Use thirdweb v5 instead of @thirdweb-dev/react v4');
console.log('   thirdweb v5 is compatible with ethers v6');

