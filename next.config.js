/** @type {import('next').NextConfig} */
const path = require('path');

/**
 * Environment Variables Validation
 * This runs at build-time and will fail the build if required env vars are missing/invalid
 * Esto asegura que si la variable está vacía o es una dirección inválida,
 * EL BUILD FALLA en Vercel. Así no despliegas código roto a producción.
 */
require('./env.js');

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
    // Apply to both client and server during build to avoid pre-rendering errors
    // At runtime, server-side code (like Hardhat) will use ethers v6 from node_modules
    try {
      // We already have ethers-v5 installed as an alias to ethers@5.7.2
      const ethersV5Path = require.resolve('ethers-v5');
      // require.resolve('ethers-v5') returns ethers/lib/index.js
      // So we need to go up one level to get the ethers package root
      const ethersV5LibDir = path.dirname(ethersV5Path); // ethers/lib
      const ethersV5RootDir = path.dirname(ethersV5LibDir); // ethers package root
      
      // Aliases for ethers and all its subpaths
      // This ensures that 'ethers', 'ethers/lib/utils', etc. all resolve to ethers v5
      // Only apply to thirdweb and related packages, not to our own server code
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        // Main ethers import - only for thirdweb packages
        // We use a conditional alias that checks the issuer
        // Subpaths that thirdweb uses - these need to point to the actual files in ethers v5
        'ethers/lib/utils': path.join(ethersV5RootDir, 'lib', 'utils.js'),
        'ethers/lib/utils.js': path.join(ethersV5RootDir, 'lib', 'utils.js'),
        'ethers/lib': path.join(ethersV5RootDir, 'lib'),
        // Direct exports that thirdweb expects
        'ethers/utils': path.join(ethersV5RootDir, 'lib', 'utils.js'),
        'ethers/constants': path.join(ethersV5RootDir, 'lib', 'constants.js'),
      };
      
      // For client-side, alias main ethers import to ethers v5
      if (!isServer) {
        config.resolve.alias['ethers'] = ethersV5Path;
      }
      
      // CRITICAL: Use NormalModuleReplacementPlugin to replace ethers imports
      // This replaces ethers imports from thirdweb packages with ethers v5
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^ethers$/,
          (resource) => {
            const issuer = resource.context || '';
            // Replace ethers import if coming from thirdweb packages
            if (issuer.includes('node_modules') && 
                (issuer.includes('@thirdweb-dev') || issuer.includes('thirdweb')) &&
                !issuer.includes('hardhat') && !issuer.includes('@nomicfoundation')) {
              resource.request = ethersV5Path;
            }
          }
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^ethers\/lib\/(.*)$/,
          (resource) => {
            const issuer = resource.context || '';
            // Replace if coming from node_modules (third-party packages like thirdweb)
            // Exclude our own code and Hardhat to avoid breaking ethers v6 usage
            if (issuer.includes('node_modules') && 
                !issuer.includes('lib/compat') &&
                !issuer.includes('hardhat') &&
                !issuer.includes('@nomicfoundation')) {
              const subpath = resource.request.match(/^ethers\/lib\/(.*)$/)[1];
              const replacementPath = path.join(ethersV5RootDir, 'lib', subpath);
              resource.request = replacementPath;
            }
          }
        ),
        // Also replace direct imports like 'ethers/utils', 'ethers/constants', 'ethers/providers'
        new webpack.NormalModuleReplacementPlugin(
          /^ethers\/(utils|constants|providers)$/,
          (resource) => {
            const issuer = resource.context || '';
            if (issuer.includes('node_modules') && 
                !issuer.includes('hardhat') &&
                !issuer.includes('@nomicfoundation')) {
              const subpath = resource.request.match(/^ethers\/(.*)$/)[1];
              const replacementPath = path.join(ethersV5RootDir, 'lib', `${subpath}.js`);
              resource.request = replacementPath;
            }
          }
        )
      );
      
      console.log('✅ Configured all ethers imports to use ethers v5 (for thirdweb v4 compatibility)');
    } catch (e) {
      console.warn('⚠️  Error setting up ethers v5 alias:', e.message);
    }
    
    return config;
  },
};

module.exports = nextConfig;
