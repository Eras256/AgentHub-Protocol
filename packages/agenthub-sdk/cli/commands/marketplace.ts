/**
 * Marketplace Commands
 */

import { AgentHubSDK } from "../index-export";

export async function publishServiceCommand(options: {
  name: string;
  description: string;
  endpoint: string;
  price: string;
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

    console.log("📝 Publishing service to marketplace...");
    console.log(`   Name: ${options.name}`);
    console.log(`   Price: ${options.price} USDC`);
    console.log(`   Network: ${network}`);

    const sdk = new AgentHubSDK({
      network: network as any,
      privateKey,
    });

    const tx = await sdk.marketplace.publishService({
      name: options.name,
      description: options.description,
      endpointURL: options.endpoint,
      pricePerRequest: options.price,
    });

    console.log("✅ Service published successfully!");
    console.log(`   Transaction: ${tx.hash}`);
    console.log(`   Block: ${tx.blockNumber}`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

