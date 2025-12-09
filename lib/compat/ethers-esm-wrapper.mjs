// ESM wrapper for ethers shim - this file uses real ESM syntax
// Webpack will treat this as a true ESM module with named exports
// CRITICAL: Use dynamic import to load CommonJS module
let ethersShim;
let ethersShimModule;

// Use createRequire for better CommonJS interop in ESM
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

try {
  // Load the CommonJS shim
  ethersShimModule = require('./ethers-providers-shim.js');
  ethersShim = ethersShimModule.default || ethersShimModule;
  
  // Verify it loaded correctly
  if (!ethersShim || typeof ethersShim !== 'object') {
    throw new Error('Failed to load ethers shim');
  }
} catch (e) {
  console.error('Failed to load ethers-providers-shim:', e);
  // Create minimal fallback
  ethersShim = {};
}

// Ensure Signer exists
if (!ethersShim.Signer || typeof ethersShim.Signer !== 'function') {
  ethersShim.Signer = class Signer {
    constructor() {
      if (new.target === Signer) {
        throw new Error('Signer is abstract and cannot be instantiated directly');
      }
    }
    
    getAddress() {
      throw new Error('getAddress must be implemented by subclass');
    }
    
    signMessage() {
      throw new Error('signMessage must be implemented by subclass');
    }
    
    signTransaction() {
      throw new Error('signTransaction must be implemented by subclass');
    }
  };
}

// Create the main export object with all properties
const ethersExport = Object.assign({}, ethersShim);
ethersExport.utils = ethersShim.utils || {};
ethersExport.providers = ethersShim.providers || {};
ethersExport.BigNumber = ethersShim.BigNumber;
ethersExport.constants = ethersShim.constants || {};
ethersExport.Signer = ethersShim.Signer;

// CRITICAL: Export default FIRST
export default ethersExport;

// CRITICAL: Export named exports explicitly - webpack needs these to be static exports
// These are the exports that @thirdweb-dev/wallets expects
// Using const ensures they are static and webpack can tree-shake correctly
export const utils = ethersExport.utils;
export const providers = ethersExport.providers;
export const BigNumber = ethersExport.BigNumber;
export const constants = ethersExport.constants;
export const Signer = ethersExport.Signer;

// Re-export all other properties from ethers via default export
// This ensures that ethers.* access works correctly

