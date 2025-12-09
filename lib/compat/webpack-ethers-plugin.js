// Webpack plugin to add named exports to ethers shim for ESM compatibility
class EthersShimPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('EthersShimPlugin', (nmf) => {
      nmf.hooks.beforeResolve.tap('EthersShimPlugin', (data) => {
        // Only process ethers module requests
        if (data.request === 'ethers' || data.request.startsWith('ethers/')) {
          // This will be handled by the alias, so we don't need to do anything here
        }
      });
    });

    compiler.hooks.compilation.tap('EthersShimPlugin', (compilation) => {
      compilation.hooks.buildModule.tap('EthersShimPlugin', (module) => {
        // Add named exports to ethers module if it's being imported
        if (module.resource && module.resource.includes('ethers-providers-shim')) {
          // Mark the module as having these exports
          if (!module.buildInfo) {
            module.buildInfo = {};
          }
          module.buildInfo.exports = ['utils', 'providers', 'BigNumber', 'constants'];
        }
      });
    });
  }
}

module.exports = EthersShimPlugin;

