/**
 * Validation utilities
 */

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidAgentId(agentId: string): boolean {
  return agentId.length > 0 && agentId.length <= 64;
}

export function isValidIPFSHash(hash: string): boolean {
  // Basic IPFS hash validation (CID v0 or v1)
  return (
    hash.startsWith("Qm") && hash.length === 46 ||
    hash.startsWith("ipfs://") ||
    /^[a-zA-Z0-9]{46,}$/.test(hash)
  );
}

export function validateStakeAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 1.0; // Minimum 1 AVAX
}

