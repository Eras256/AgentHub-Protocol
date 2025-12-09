// Compatibility shim for @thirdweb-dev/react v4 to work with ethers v6
// This provides StaticJsonRpcProvider and other v5 providers that were renamed in v6

// Require the real ethers module
// Note: Webpack should NOT alias 'ethers' when this file requires it
// The webpack config uses NormalModuleReplacementPlugin to only replace
// ethers imports from thirdweb packages, not from this shim file
let ethers;
try {
  ethers = require('ethers');
  
  // Verify that ethers is actually loaded and not circular
  if (!ethers || typeof ethers !== 'object') {
    throw new Error('ethers module is not properly loaded');
  }
  
  // Check if we accidentally got the shim (circular dependency)
  if (ethers.providers && ethers.providers.StaticJsonRpcProvider && 
      ethers.providers.StaticJsonRpcProvider.name === 'StaticJsonRpcProviderImpl') {
    // We got the shim instead of real ethers - this shouldn't happen but handle it
    console.warn('⚠️  Circular dependency detected in ethers shim, trying to resolve real ethers...');
    // Try to get real ethers from a different path
    const path = require('path');
    const realEthersPath = path.resolve(process.cwd(), 'node_modules/ethers');
    try {
      delete require.cache[require.resolve('ethers')];
      ethers = require(realEthersPath);
    } catch (e) {
      // If that fails, we'll use what we have and hope for the best
      console.warn('⚠️  Could not resolve real ethers, using available module');
    }
  }
} catch (e) {
  console.error('Failed to require ethers:', e);
  throw e;
}

// Create a StaticJsonRpcProvider class that extends JsonRpcProvider
// In ethers v6, StaticJsonRpcProvider was merged into JsonRpcProvider
// Use a safe check to ensure JsonRpcProvider exists before extending
let StaticJsonRpcProvider;
let providers = {};

if (ethers.JsonRpcProvider && typeof ethers.JsonRpcProvider === 'function') {
  class StaticJsonRpcProviderImpl extends ethers.JsonRpcProvider {
    constructor(url, network, options) {
      super(url, network, options);
    }
  }
  StaticJsonRpcProvider = StaticJsonRpcProviderImpl;
  
  // Create providers namespace for compatibility with ethers v5 API
  providers = {
    StaticJsonRpcProvider: StaticJsonRpcProvider,
    JsonRpcProvider: ethers.JsonRpcProvider,
    // Add other common providers if they exist
    WebSocketProvider: ethers.WebSocketProvider || null,
    AlchemyProvider: ethers.AlchemyProvider || null,
    InfuraProvider: ethers.InfuraProvider || null,
    CloudflareProvider: ethers.CloudflareProvider || null,
    AnkrProvider: ethers.AnkrProvider || null,
    PocketProvider: ethers.PocketProvider || null,
  };
  
  // Filter out null values
  Object.keys(providers).forEach(key => {
    if (providers[key] === null) {
      delete providers[key];
    }
  });
} else {
  // Fallback: create a simple class if JsonRpcProvider is not available
  // This shouldn't happen with ethers v6, but provides a safety net
  StaticJsonRpcProvider = class StaticJsonRpcProvider {
    constructor(url, network, options) {
      this.url = url;
      this.network = network;
      this.options = options;
    }
  };
  
  providers = {
    StaticJsonRpcProvider: StaticJsonRpcProvider,
    JsonRpcProvider: StaticJsonRpcProvider, // Use same class as fallback
  };
}

// Attach providers to ethers object for compatibility
if (!ethers.providers) {
  ethers.providers = providers;
} else {
  // Merge with existing providers if any
  Object.assign(ethers.providers, providers);
}

// Also attach StaticJsonRpcProvider directly to ethers for direct access
ethers.StaticJsonRpcProvider = StaticJsonRpcProvider;

// Create utils namespace for compatibility (ethers v6 has utils at root level)
if (!ethers.utils) {
  // In ethers v6, many utils are at root level, but some packages expect ethers.utils
  ethers.utils = {
    // Re-export common utils
    getAddress: ethers.getAddress,
    isAddress: ethers.isAddress,
    formatUnits: ethers.formatUnits,
    parseUnits: ethers.parseUnits,
    formatEther: ethers.formatEther,
    parseEther: ethers.parseEther,
    getContractAddress: ethers.getContractAddress,
    getCreateAddress: ethers.getCreateAddress,
    getCreate2Address: ethers.getCreate2Address,
    solidityPackedKeccak256: ethers.solidityPackedKeccak256,
    solidityPackedSha256: ethers.solidityPackedSha256,
    solidityPacked: ethers.solidityPacked,
    id: ethers.id,
    keccak256: ethers.keccak256,
    sha256: ethers.sha256,
    namehash: ethers.namehash,
    dnsEncode: ethers.dnsEncode,
    isValidName: ethers.isValidName,
    toUtf8String: ethers.toUtf8String,
    toUtf8Bytes: ethers.toUtf8Bytes,
    hexlify: ethers.hexlify,
    hexValue: ethers.hexValue,
    isHexString: ethers.isHexString,
    concat: ethers.concat,
    // In ethers v6, hexZeroPad was renamed to zeroPadValue
    // But zeroPadValue doesn't accept arrays directly, so we need a wrapper
    hexZeroPad: (ethers.zeroPadValue && typeof ethers.zeroPadValue === 'function')
      ? ((value, length) => {
          // Convert arrays to Uint8Array or hex string before calling zeroPadValue
          if (Array.isArray(value)) {
            // Convert array to Uint8Array
            const uint8Array = new Uint8Array(value);
            // Convert to hex string
            const hex = ethers.hexlify(uint8Array);
            return ethers.zeroPadValue(hex, length);
          }
          // For other types, use zeroPadValue directly
          return ethers.zeroPadValue(value, length);
        })
      : (ethers.hexZeroPad && typeof ethers.hexZeroPad === 'function'
        ? ethers.hexZeroPad
        : ((value, length) => {
            // Fallback implementation - pad hex string to specified byte length
            let hex;
            if (Array.isArray(value)) {
              // Convert array to hex string
              const uint8Array = new Uint8Array(value);
              hex = ethers.hexlify(uint8Array);
            } else {
              hex = typeof value === 'string' ? value : ethers.hexlify(value);
            }
            // Ensure it starts with 0x
            if (!hex.startsWith('0x')) {
              hex = '0x' + hex;
            }
            // Remove 0x for padding calculation
            const hexWithoutPrefix = hex.slice(2);
            // Pad to length bytes (length * 2 hex characters)
            const paddedHex = hexWithoutPrefix.padStart(length * 2, '0');
            return '0x' + paddedHex;
          })),
    // In ethers v6, arrayify was renamed to getBytes
    // Use getBytes if available, otherwise fall back to arrayify
    arrayify: (ethers.getBytes && typeof ethers.getBytes === 'function') 
      ? ethers.getBytes 
      : (ethers.arrayify && typeof ethers.arrayify === 'function' 
        ? ethers.arrayify 
        : ((value) => {
            // Fallback implementation if neither exists
            throw new Error('arrayify/getBytes not available in ethers');
          })),
    stripZerosLeft: ethers.stripZerosLeft,
    Interface: ethers.Interface,
    AbiCoder: ethers.AbiCoder,
    defaultAbiCoder: ethers.AbiCoder.defaultAbiCoder,
    Fragment: ethers.Fragment,
    FunctionFragment: ethers.FunctionFragment,
    EventFragment: ethers.EventFragment,
    ParamType: ethers.ParamType,
    ErrorFragment: ethers.ErrorFragment,
    // Add more as needed
  };
}

// BigNumber compatibility - ethers v6 uses native BigInt
// Create a BigNumber-like class for compatibility
class BigNumber {
  constructor(value) {
    this._value = typeof value === 'bigint' ? value : BigInt(value);
  }
  
  static from(value) {
    return new BigNumber(value);
  }
  
  toString() {
    return this._value.toString();
  }
  
  toNumber() {
    return Number(this._value);
  }
  
  toBigInt() {
    return this._value;
  }
  
  add(other) {
    return new BigNumber(this._value + BigInt(other));
  }
  
  sub(other) {
    return new BigNumber(this._value - BigInt(other));
  }
  
  mul(other) {
    return new BigNumber(this._value * BigInt(other));
  }
  
  div(other) {
    return new BigNumber(this._value / BigInt(other));
  }
  
  eq(other) {
    return this._value === BigInt(other);
  }
  
  lt(other) {
    return this._value < BigInt(other);
  }
  
  lte(other) {
    return this._value <= BigInt(other);
  }
  
  gt(other) {
    return this._value > BigInt(other);
  }
  
  gte(other) {
    return this._value >= BigInt(other);
  }
}

// Constants compatibility
const constants = {
  AddressZero: '0x0000000000000000000000000000000000000000',
  HashZero: '0x0000000000000000000000000000000000000000000000000000000000000000',
  EtherSymbol: 'Ξ',
  Zero: BigInt(0),
  One: BigInt(1),
  Two: BigInt(2),
  WeiPerEther: BigInt('1000000000000000000'),
};

// Attach BigNumber and constants to ethers
ethers.BigNumber = BigNumber;
ethers.constants = constants;

// Signer compatibility - ethers v6 has AbstractSigner, but v5 packages expect Signer
// In ethers v6, Signer is an abstract class that can be imported
let Signer;
try {
  // Try to get Signer from ethers v6
  if (ethers.Signer && typeof ethers.Signer === 'function') {
    Signer = ethers.Signer;
  } else if (ethers.AbstractSigner && typeof ethers.AbstractSigner === 'function') {
    // Use AbstractSigner as Signer if Signer doesn't exist
    Signer = ethers.AbstractSigner;
  } else {
    // Fallback: create a minimal Signer-like class that can be extended
    Signer = class Signer {
      constructor() {
        // This is an abstract class, should not be instantiated directly
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
} catch (e) {
  // If all else fails, create a basic Signer class
  Signer = class Signer {
    constructor() {
      if (new.target === Signer) {
        throw new Error('Signer is abstract and cannot be instantiated directly');
      }
    }
  };
}

// Always attach Signer to ethers (CRITICAL: must be defined)
ethers.Signer = Signer;

// Ensure Signer is always available, even if it wasn't found
if (!ethers.Signer) {
  console.warn('⚠️  Signer not found in ethers, creating fallback');
  ethers.Signer = class Signer {
    constructor() {
      if (new.target === Signer) {
        throw new Error('Signer is abstract and cannot be instantiated directly');
      }
    }
  };
  Signer = ethers.Signer;
}

// Export the patched ethers object with named exports for ESM compatibility
module.exports = ethers;
// Also export utils and providers as named exports for direct imports
module.exports.utils = ethers.utils || {};
module.exports.providers = providers || {};
module.exports.BigNumber = BigNumber;
module.exports.constants = constants || {};
module.exports.Signer = ethers.Signer; // Always use ethers.Signer to ensure consistency

