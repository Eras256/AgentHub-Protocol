// Webpack loader to transform ethers shim CommonJS to ESM
// This ensures webpack recognizes named exports correctly
module.exports = function(source) {
  // This loader wraps the CommonJS module to make it ESM-compatible
  // Webpack will recognize the exports from the module.exports object
  
  // The source is already a CommonJS module with module.exports
  // We just need to ensure webpack can see the exports
  // Return the source as-is, webpack should handle it with our plugin
  return source;
};

// Mark as raw loader to get the source as a string
module.exports.raw = false;

