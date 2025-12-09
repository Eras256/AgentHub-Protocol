// Compatibility shim for ethers/lib/utils
// Re-export utils from ethers v6 in v5 format
// Supports both CommonJS and ESM imports
let ethers;
try {
  ethers = require('ethers');
} catch (e) {
  console.error('Failed to require ethers:', e);
  throw e;
}

// Create utils object compatible with ethers v5
const utils = {
  // Re-export common utils from ethers v6
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
  // ABI-related utilities
  Interface: ethers.Interface,
  AbiCoder: ethers.AbiCoder,
  defaultAbiCoder: ethers.AbiCoder.defaultAbiCoder,
  Fragment: ethers.Fragment,
  FunctionFragment: ethers.FunctionFragment,
  EventFragment: ethers.EventFragment,
  ParamType: ethers.ParamType,
  ErrorFragment: ethers.ErrorFragment,
  // BigNumber compatibility (ethers v6 uses native BigInt)
  BigNumber: {
    from: (value) => {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'string') return BigInt(value);
      if (typeof value === 'number') return BigInt(value);
      return BigInt(String(value));
    },
  },
  // defineReadOnly - utility function from ethers v5
  defineReadOnly: (object, name, value) => {
    Object.defineProperty(object, name, {
      enumerable: true,
      value: value,
      writable: false,
    });
  },
};

// Support both CommonJS and ESM exports
module.exports = utils;
// Also set default export for ESM compatibility
module.exports.default = utils;
// Export individual utilities for named imports
Object.keys(utils).forEach(key => {
  module.exports[key] = utils[key];
});

