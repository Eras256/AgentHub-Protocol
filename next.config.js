/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // Transpile thirdweb packages
  transpilePackages: ['@thirdweb-dev/react', '@thirdweb-dev/react-core', '@thirdweb-dev/sdk', 'thirdweb'],
  webpack: (config, { isServer, webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      'pino-pretty': false,
    };
    
    // CRITICAL: According to official Thirdweb documentation (December 2025)
    // @thirdweb-dev/react v4 requires ethers v5, NOT ethers v6
    // Solution: Use aliases to make ALL ethers imports use ethers v5
    // Only apply on client-side to avoid breaking Hardhat (server-side uses ethers v6)
    if (!isServer) {
      try {
        // We already have ethers-v5 installed as an alias to ethers@5.7.2
        const ethersV5Path = require.resolve('ethers-v5');
        // require.resolve('ethers-v5') returns ethers/lib/index.js
        // So we need to go up one level to get the ethers package root
        const ethersV5LibDir = path.dirname(ethersV5Path); // ethers/lib
        const ethersV5RootDir = path.dirname(ethersV5LibDir); // ethers package root
        
        // Aliases for ethers and all its subpaths
        // This ensures that 'ethers', 'ethers/lib/utils', etc. all resolve to ethers v5
        config.resolve.alias = {
          ...(config.resolve.alias || {}),
          // Main ethers import
          'ethers': ethersV5Path,
          // Subpaths that thirdweb uses - these need to point to the actual files in ethers v5
          'ethers/lib/utils': path.join(ethersV5RootDir, 'lib', 'utils.js'),
          'ethers/lib/utils.js': path.join(ethersV5RootDir, 'lib', 'utils.js'),
          'ethers/lib': path.join(ethersV5RootDir, 'lib'),
        };
        
        // CRITICAL: Use NormalModuleReplacementPlugin to replace ethers subpath imports
        // This is more reliable than aliases for subpaths like 'ethers/lib/utils'
        // Replace ALL ethers/lib/* imports in client-side code (from node_modules)
        // This includes thirdweb, zksync-web3, and any other packages that use ethers v5 API
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            /^ethers\/lib\/(.*)$/,
            (resource) => {
              const issuer = resource.context || '';
              // Replace if coming from node_modules (third-party packages)
              // Exclude our own code in lib/, app/, components/, etc. to avoid breaking ethers v6 usage
              if (issuer.includes('node_modules') && !issuer.includes('lib/compat')) {
                const subpath = resource.request.match(/^ethers\/lib\/(.*)$/)[1];
                const replacementPath = path.join(ethersV5RootDir, 'lib', subpath);
                resource.request = replacementPath;
              }
            }
          )
        );
        
        console.log('✅ Configured all ethers imports to use ethers v5 (for thirdweb v4 compatibility)');
      } catch (e) {
        console.warn('⚠️  Error setting up ethers v5 alias:', e.message);
      }
    }
    
    return config;
  },
};

module.exports = nextConfig;
