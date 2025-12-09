#!/usr/bin/env node

/**
 * AgentHub Protocol CLI
 * Command-line tools for AgentHub Protocol
 */

import { Command } from "commander";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

const program = new Command();

program
  .name("agenthub")
  .description("AgentHub Protocol CLI - Build and manage autonomous AI agents")
  .version("1.0.0");

// Agent register command
program
  .command("agent:register")
  .description("Register a new agent")
  .requiredOption("--agent-id <id>", "Agent ID")
  .requiredOption("--metadata <ipfs>", "IPFS metadata hash")
  .requiredOption("--stake <amount>", "Stake amount in AVAX")
  .option("--private-key <key>", "Private key (or use PRIVATE_KEY env var)")
  .option("--network <network>", "Network (fuji|mainnet)", "fuji")
  .action(async (options) => {
    const { registerAgentCommand } = await import("./commands/register");
    await registerAgentCommand(options);
  });

// Marketplace publish command
program
  .command("marketplace:publish")
  .description("Publish a service to marketplace")
  .requiredOption("--name <name>", "Service name")
  .requiredOption("--description <desc>", "Service description")
  .requiredOption("--endpoint <url>", "Service endpoint URL")
  .requiredOption("--price <price>", "Price per request in USDC")
  .option("--private-key <key>", "Private key")
  .option("--network <network>", "Network", "fuji")
  .action(async (options) => {
    const { publishServiceCommand } = await import("./commands/marketplace");
    await publishServiceCommand(options);
  });

// x402 payment command
program
  .command("x402:pay")
  .description("Make x402 payment")
  .requiredOption("--amount <amount>", "Payment amount")
  .option("--token <token>", "Token (USDC|AVAX)", "USDC")
  .option("--tier <tier>", "Payment tier (basic|premium)", "basic")
  .option("--api-url <url>", "API endpoint URL", "/api/x402/pay")
  .action(async (options) => {
    const { x402PayCommand } = await import("./commands/x402");
    await x402PayCommand(options);
  });

// Parse arguments
program.parse();
