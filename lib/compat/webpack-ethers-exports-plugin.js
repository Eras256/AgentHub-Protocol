// Webpack plugin to ensure ethers shim exports are recognized
class EthersExportsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('EthersExportsPlugin', (compilation) => {
      // Hook into the optimize phase to modify module exports
      compilation.hooks.optimizeChunkModules.tap('EthersExportsPlugin', (chunks) => {
        chunks.forEach((chunk) => {
          chunk.modulesIterable.forEach((module) => {
            const normalizedResource = module.resource ? module.resource.replace(/\\/g, '/') : '';
            if (normalizedResource.includes('ethers-esm-wrapper') || 
                normalizedResource.includes('ethers-providers-shim')) {
              // Ensure the module has the correct exports metadata
              if (!module.buildMeta) {
                module.buildMeta = {};
              }
              module.buildMeta.exportsType = 'named';
              if (!module.buildMeta.providedExports) {
                module.buildMeta.providedExports = [];
              }
              // Add all required exports
              const requiredExports = ['utils', 'providers', 'BigNumber', 'constants', 'Signer', 'default'];
              requiredExports.forEach(exp => {
                if (!module.buildMeta.providedExports.includes(exp)) {
                  module.buildMeta.providedExports.push(exp);
                }
              });
              
              // Also mark as ESM module
              if (!module.buildMeta.esModule) {
                module.buildMeta.esModule = true;
              }
            }
          });
        });
      });
      
      // Also hook into the seal phase to ensure exports are preserved
      compilation.hooks.seal.tap('EthersExportsPlugin', () => {
        compilation.modules.forEach((module) => {
          const normalizedResource = module.resource ? module.resource.replace(/\\/g, '/') : '';
          if (normalizedResource.includes('ethers-esm-wrapper')) {
            if (module.buildMeta) {
              module.buildMeta.exportsType = 'named';
              if (!module.buildMeta.providedExports) {
                module.buildMeta.providedExports = [];
              }
              const requiredExports = ['utils', 'providers', 'BigNumber', 'constants', 'Signer', 'default'];
              requiredExports.forEach(exp => {
                if (!module.buildMeta.providedExports.includes(exp)) {
                  module.buildMeta.providedExports.push(exp);
                }
              });
            }
          }
        });
      });
    });
  }
}

module.exports = EthersExportsPlugin;

