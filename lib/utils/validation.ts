export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidIPFSHash(hash: string): boolean {
  return hash.startsWith("ipfs://") || /^Qm[a-zA-Z0-9]{44}$/.test(hash);
}

export function validateStakeAmount(amount: string): {
  valid: boolean;
  error?: string;
} {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return { valid: false, error: "Invalid amount" };
  }
  if (numAmount < 1) {
    return { valid: false, error: "Minimum stake is 1 AVAX" };
  }
  return { valid: true };
}

export function validateAgentId(agentId: string): {
  valid: boolean;
  error?: string;
} {
  if (!agentId || agentId.trim().length === 0) {
    return { valid: false, error: "Agent ID is required" };
  }
  if (agentId.length < 3) {
    return { valid: false, error: "Agent ID must be at least 3 characters" };
  }
  return { valid: true };
}

