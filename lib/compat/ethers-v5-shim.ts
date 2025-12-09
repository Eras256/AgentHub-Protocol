// Compatibility shim for @thirdweb-dev/react v4 to work with ethers v6
// This provides StaticJsonRpcProvider which was renamed in ethers v6

import { JsonRpcProvider } from 'ethers';

// StaticJsonRpcProvider was renamed to JsonRpcProvider in ethers v6
// Export it with the old name for compatibility
export const StaticJsonRpcProvider = JsonRpcProvider;

// Re-export other commonly used providers
export { JsonRpcProvider, BrowserProvider } from 'ethers';

