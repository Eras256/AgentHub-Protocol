// ESM-compatible wrapper for ethers shim
// This file provides named exports that webpack can understand
let ethers;
try {
  ethers = require('./ethers-providers-shim.js');
} catch (e) {
  console.error('Failed to require ethers-providers-shim:', e);
  // Create a minimal fallback to prevent undefined errors
  ethers = {};
}

// CRITICAL: Verify ethers is loaded correctly
if (!ethers || typeof ethers !== 'object') {
  console.error('⚠️  ethers shim returned invalid value, creating minimal fallback');
  ethers = {};
}

// CRITICAL: Ensure Signer exists before exporting
// This is the most important export for Thirdweb compatibility
if (!ethers.Signer || typeof ethers.Signer !== 'function') {
  console.warn('⚠️  Signer not found in ethers shim, creating fallback');
  ethers.Signer = class Signer {
    constructor() {
      if (new.target === Signer) {
        throw new Error('Signer is abstract and cannot be instantiated directly');
      }
    }
    
    // Placeholder methods that subclasses should implement
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

// CRITICAL: Mark as ES module FIRST before any exports
// This tells webpack to treat this as an ESM module
Object.defineProperty(module.exports, '__esModule', {
  value: true,
  enumerable: false,
  configurable: false,
  writable: false,
});

// CRITICAL: Export default (the main ethers object) with ALL properties
// This ensures that when someone does `import ethers from 'ethers'`, they get the full object
// We need to create a new object that has all properties from ethers
const ethersExport = Object.assign({}, ethers);
// Ensure critical properties are present
ethersExport.utils = ethers.utils || {};
ethersExport.providers = ethers.providers || {};
ethersExport.BigNumber = ethers.BigNumber;
ethersExport.constants = ethers.constants || {};
ethersExport.Signer = ethers.Signer; // CRITICAL: Must be defined

module.exports.default = ethersExport;

// CRITICAL: Export named exports DIRECTLY as properties
// Webpack needs these to be direct assignments, not via Object.defineProperty
// These must be synchronous and available immediately
module.exports.utils = ethers.utils || {};
module.exports.providers = ethers.providers || {};
module.exports.BigNumber = ethers.BigNumber;
module.exports.constants = ethers.constants || {};
// CRITICAL: Signer must be defined and be a function/class
module.exports.Signer = ethers.Signer;

// Copy all other properties from ethers to ensure everything is available
// This ensures that any property accessed via ethers.* is also available
Object.keys(ethers).forEach(key => {
  if (key !== 'default' && !module.exports.hasOwnProperty(key)) {
    try {
      module.exports[key] = ethers[key];
      // Also add to default export
      if (!ethersExport.hasOwnProperty(key)) {
        ethersExport[key] = ethers[key];
      }
    } catch (e) {
      // Ignore errors for non-configurable properties
    }
  }
});

// CRITICAL: Re-export the default as the main export object
// This ensures that the default export has all properties including Signer
module.exports.default = ethersExport;

// CRITICAL: Also export the ethers object directly as module.exports
// This ensures compatibility with both ESM and CommonJS imports
// When someone does `const ethers = require('ethers')`, they get the full object
Object.assign(module.exports, ethersExport);

// Final verification: ensure Signer is always available
if (!module.exports.Signer || typeof module.exports.Signer !== 'function') {
  console.error('⚠️  CRITICAL: Signer is still not available after all exports!');
  // Create a final fallback
  const FallbackSigner = class Signer {
    constructor() {
      if (new.target === Signer) {
        throw new Error('Signer is abstract and cannot be instantiated directly');
      }
    }
  };
  module.exports.Signer = FallbackSigner;
  module.exports.default.Signer = FallbackSigner;
  ethersExport.Signer = FallbackSigner;
}

// Debug: Log exports in development
if (process.env.NODE_ENV === 'development') {
  console.log('✅ ethers-esm-wrapper exports:', {
    hasSigner: !!module.exports.Signer,
    hasDefault: !!module.exports.default,
    signerType: typeof module.exports.Signer,
    defaultType: typeof module.exports.default,
  });
}

