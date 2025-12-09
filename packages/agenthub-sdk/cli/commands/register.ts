/**
 * Register Agent Command
 */

import { AgentHubSDK } from "../../src/client";

export async function registerAgentCommand(options: {
  agentId: string;
  metadata: string;
  stake: string;
  privateKey?: string;
  network?: string;
}) {
  try {
    const privateKey = options.privateKey || process.env.PRIVATE_KEY;

    if (!privateKey) {
      console.error("❌ Error: Private key required. Use --private-key or set PRIVATE_KEY env var");
      process.exit(1);
    }

    const network = options.network === "mainnet" ? "avalanche-mainnet" : "avalanche-fuji";

    console.log("🚀 Registering agent...");
    console.log(`   Agent ID: ${options.agentId}`);
    console.log(`   Network: ${network}`);
    console.log(`   Stake: ${options.stake} AVAX`);

    const sdk = new AgentHubSDK({
      network: network as any,
      privateKey,
    });

    const tx = await sdk.agents.register({
      agentId: options.agentId,
      metadataIPFS: options.metadata,
      stakeAmount: options.stake,
    });

    console.log("✅ Agent registered successfully!");
    console.log(`   Transaction: ${tx.hash}`);
    console.log(`   Block: ${tx.blockNumber}`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

