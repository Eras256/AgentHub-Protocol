// Kite AI Proof of Attributed Intelligence (PoAI) Generator
// Creates cryptographic proofs of AI decisions for on-chain attribution
// Compatible with AgentRegistry smart contract

import { keccak256, toHex, stringToBytes } from "viem";

export interface PoAIProof {
  agentId: string;
  model: string;
  inputHash: string;
  outputHash: string;
  timestamp: number;
  // In a real Kite SDK, this would include a signature
}

/**
 * Generates a deterministic Proof of Attributed Intelligence
 * compatible with AgentRegistry smart contract
 * 
 * @param agentId - Unique identifier for the AI agent
 * @param model - Model name used (e.g., "gemini-2.5-flash")
 * @param prompt - Input prompt sent to the AI
 * @param response - AI-generated response
 * @returns Proof object and proofHash for on-chain storage
 */
export async function generatePoAI(
  agentId: string,
  model: string,
  prompt: string,
  response: string
): Promise<{ proof: PoAIProof; proofHash: `0x${string}` }> {
  // 1. Create cryptographic hashes of inputs/outputs
  // This ensures privacy while allowing verification
  const inputHash = keccak256(stringToBytes(prompt));
  const outputHash = keccak256(stringToBytes(response));
  const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp

  const proof: PoAIProof = {
    agentId,
    model,
    inputHash,
    outputHash,
    timestamp,
  };

  // 2. Create a unique hash for this proof event
  // Structure: keccak256(agentId + model + inputHash + outputHash + timestamp)
  // This creates a deterministic hash that can be verified on-chain
  const proofString = `${agentId}:${model}:${inputHash}:${outputHash}:${timestamp}`;
  const proofHash = keccak256(stringToBytes(proofString));

  return { proof, proofHash };
}

/**
 * Verify a PoAI proof by recomputing the hash
 * Useful for off-chain verification before submitting to contract
 */
export function verifyPoAI(
  proof: PoAIProof,
  expectedProofHash: `0x${string}`
): boolean {
  const proofString = `${proof.agentId}:${proof.model}:${proof.inputHash}:${proof.outputHash}:${proof.timestamp}`;
  const computedHash = keccak256(stringToBytes(proofString));
  return computedHash.toLowerCase() === expectedProofHash.toLowerCase();
}

/**
 * Format PoAI proof for smart contract storage
 * Converts proof to the format expected by AgentRegistry contract
 */
export function formatPoAIForContract(proofHash: `0x${string}`): {
  kitePoAIHash: `0x${string}`;
} {
  return {
    kitePoAIHash: proofHash,
  };
}

