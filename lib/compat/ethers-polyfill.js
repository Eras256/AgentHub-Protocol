// Polyfill to add ethers v5 exports to ethers v6 for thirdweb v4 compatibility
// This file should be imported before any thirdweb imports
// Note: This is a no-op in Next.js because webpack aliases handle the compatibility

// The actual polyfill is handled by webpack aliases in next.config.js
// which redirects all 'ethers' imports to 'ethers-v5' (ethers@5.7.2)
// This file exists as a placeholder to ensure the import order is correct

// In case webpack aliases don't work (e.g., in Vercel), we can add runtime polyfills here
if (typeof window !== 'undefined') {
  // This will only run if webpack aliases fail
  // Most of the time, webpack aliases will handle everything
  try {
    // Dynamic import to avoid issues with SSR
    import('ethers').then((ethersModule) => {
      const ethers = ethersModule.default || ethersModule;
      
      // Only add polyfills if they don't exist (ethers v6 case)
      if (ethers && !ethers.utils) {
        console.warn('⚠️  ethers.utils not found - webpack alias may not be working');
        // Try to import utils from ethers/lib/utils
        import('ethers/lib/utils').then((utilsModule) => {
          ethers.utils = utilsModule.default || utilsModule;
        }).catch(() => {
          console.warn('⚠️  Could not import ethers/lib/utils');
        });
      }
    }).catch(() => {
      // ethers import failed - this is expected if webpack alias is working
      // because 'ethers' will resolve to 'ethers-v5' which may not be importable this way
    });
  } catch (e) {
    // Ignore errors - webpack aliases should handle everything
  }
}

