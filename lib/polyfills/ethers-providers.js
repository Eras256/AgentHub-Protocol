// Polyfill for ethers v5 providers compatibility with ethers v6
// Thirdweb SDK v4 expects ethers v5 providers, but we're using ethers v6

import * as ethers from 'ethers';

// Patch ethers to add providers namespace for compatibility with ethers v5
if (typeof window !== 'undefined' && ethers && !ethers.providers) {
  // Create providers namespace
  ethers.providers = {
    StaticJsonRpcProvider: ethers.JsonRpcProvider,
    JsonRpcProvider: ethers.JsonRpcProvider,
    WebSocketProvider: ethers.WebSocketProvider,
  };
  
  // Also add StaticJsonRpcProvider directly
  ethers.StaticJsonRpcProvider = ethers.JsonRpcProvider;
}

export default ethers;

