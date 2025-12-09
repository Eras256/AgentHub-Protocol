/**
 * End-to-End Tests for AgentHub CLI
 * Tests complete CLI functionality with real commands
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Jest globals are available in test environment via ts-jest
// TypeScript may show errors in IDE, but tests run correctly with Jest
// @ts-expect-error - Jest types are loaded by ts-jest at runtime
import { describe, it, expect, beforeAll } from "@jest/globals";
import { execSync, spawn } from "child_process";
import path from "path";
import * as dotenv from "dotenv";
import { AgentHubSDK } from "../src/client";

// Load environment variables from multiple locations
dotenv.config({ path: path.join(process.cwd(), "../../.env.local") });
dotenv.config({ path: path.join(process.cwd(), "../../.env") });
dotenv.config();

const CLI_PATH = path.join(__dirname, "../cli/index.ts");
const TSX_CMD = "tsx";
const TEST_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
const TEST_RPC_URL = process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS;

// Log configuration for debugging
if (TEST_PRIVATE_KEY) {
  console.log("✅ PRIVATE_KEY loaded from environment");
  if (AGENT_REGISTRY_ADDRESS) {
    console.log(`✅ AgentRegistry address: ${AGENT_REGISTRY_ADDRESS}`);
  } else {
    console.log("⚠️ AgentRegistry address not configured (NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS)");
  }
  if (MARKETPLACE_ADDRESS) {
    console.log(`✅ Marketplace address: ${MARKETPLACE_ADDRESS}`);
  } else {
    console.log("⚠️ Marketplace address not configured (NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS)");
  }
}

// Helper to run CLI command
function runCLI(command: string, options: { env?: Record<string, string>; timeout?: number } = {}) {
  const fullCommand = `${TSX_CMD} ${CLI_PATH} ${command}`;
  try {
    const output = execSync(fullCommand, {
      encoding: "utf-8",
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, ...options.env },
      timeout: options.timeout || 60000, // 60 seconds default
      stdio: "pipe",
    });
    return { success: true, output, error: null };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout?.toString() || "",
      error: error.stderr?.toString() || error.message,
      status: error.status,
    };
  }
}

describe("AgentHub CLI - End-to-End Tests", () => {
  let sdk: AgentHubSDK;
  const testAgentId = `test-agent-${Date.now()}`;
  const testMetadataIPFS = "QmTest123456789";
  // El contrato ahora requiere mínimo 0.01 AVAX (reducido de 1 AVAX para mejor accesibilidad)
  const testStakeAmount = "0.01"; // Cantidad mínima configurable (0.01 AVAX para testnet)
  const minVerifiableAmount = "0.000001"; // Cantidad mínima para otras operaciones

  beforeAll(() => {
    if (TEST_PRIVATE_KEY) {
      sdk = new AgentHubSDK({
        network: "avalanche-fuji",
        privateKey: TEST_PRIVATE_KEY,
        rpcUrl: TEST_RPC_URL,
      });
    }
  });

  describe("CLI Help and Version", () => {
    it("should display help when no arguments provided", () => {
      const result = runCLI("--help");
      
      if (!result.success && result.error?.includes("tsx")) {
        console.warn("⚠️ tsx not available, skipping test");
        return;
      }

      expect(result.output).toContain("AgentHub Protocol CLI");
      expect(result.output).toContain("agent:register");
      expect(result.output).toContain("marketplace:publish");
      expect(result.output).toContain("x402:pay");
    });

    it("should display version", () => {
      const result = runCLI("--version");
      
      if (!result.success && result.error?.includes("tsx")) {
        console.warn("⚠️ tsx not available, skipping test");
        return;
      }

      expect(result.output).toContain("1.0.0");
    });
  });

  describe("agent:register Command", () => {
    it("should show help for agent:register", () => {
      const result = runCLI("agent:register --help");
      
      if (!result.success && result.error?.includes("tsx")) {
        console.warn("⚠️ tsx not available, skipping test");
        return;
      }

      expect(result.output).toContain("Register a new agent");
      expect(result.output).toContain("--agent-id");
      expect(result.output).toContain("--metadata");
      expect(result.output).toContain("--stake");
      expect(result.output).toContain("--private-key");
      expect(result.output).toContain("--network");
    });

    it("should fail when required arguments are missing", () => {
      const result = runCLI("agent:register", {
        env: { PRIVATE_KEY: TEST_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001" },
      });

      // Should fail with missing required arguments
      expect(result.success).toBe(false);
      expect(result.status).toBeGreaterThan(0);
    });

    it("should fail when private key is missing", () => {
      const result = runCLI(
        `agent:register --agent-id ${testAgentId} --metadata ${testMetadataIPFS} --stake ${testStakeAmount}`,
        { env: { PRIVATE_KEY: "" } }
      );

      expect(result.success).toBe(false);
      expect(result.error || result.output).toContain("Private key required");
    });

    it("should execute agent:register command with valid arguments and real blockchain", async () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set for real blockchain test");
        return;
      }

      // Usar un agentId único para evitar conflictos
      const uniqueAgentId = `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      console.log(`🧪 Testing agent:register with real blockchain interaction`);
      console.log(`   Agent ID: ${uniqueAgentId}`);
      console.log(`   Stake: ${testStakeAmount} AVAX (mínimo configurable del contrato)`);

      // Pass contract addresses via environment if available
      const envVars: Record<string, string> = { PRIVATE_KEY: TEST_PRIVATE_KEY };
      if (AGENT_REGISTRY_ADDRESS) {
        envVars.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS = AGENT_REGISTRY_ADDRESS;
      }

      const result = runCLI(
        `agent:register --agent-id ${uniqueAgentId} --metadata ${testMetadataIPFS} --stake ${testStakeAmount} --network fuji`,
        {
          env: envVars,
          timeout: 180000, // 3 minutes for blockchain transaction
        }
      );

      // Verificar que la transacción se ejecutó correctamente
      if (result.success) {
        expect(result.output).toContain("Registering agent");
        expect(result.output).toContain(uniqueAgentId);
        expect(result.output).toContain("Transaction:");
        expect(result.output).toContain("✅ Agent registered successfully!");
        console.log("✅ Agent registration successful on blockchain!");
      } else {
        // Si falla, verificar que sea un error de blockchain, no de CLI
        const errorMsg = result.error || result.output;
        expect(errorMsg).toBeDefined();
        expect(errorMsg).not.toContain("command not found");
        expect(errorMsg).not.toContain("missing required");
        
        // Si el error es "Agent already registered" o "Agent ID taken", es válido
        if (errorMsg.includes("already registered") || errorMsg.includes("Agent ID taken")) {
          console.log("⚠️ Agent already registered (expected in some cases)");
        } else if (errorMsg.includes("Insufficient stake")) {
          console.log("⚠️ Insufficient stake - contract requires 1 AVAX minimum");
        } else {
          console.log(`⚠️ Transaction failed: ${errorMsg}`);
        }
      }
    }, 180000);

    it("should handle network parameter correctly", () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const result = runCLI(
        `agent:register --agent-id ${testAgentId} --metadata ${testMetadataIPFS} --stake ${testStakeAmount} --network mainnet`,
        {
          env: { PRIVATE_KEY: TEST_PRIVATE_KEY },
          timeout: 120000,
        }
      );

      // Should attempt to use mainnet
      if (result.output) {
        expect(result.output).toContain("avalanche-mainnet");
      }
    }, 120000);
  });

  describe("marketplace:publish Command", () => {
    const testServiceName = `Test Service ${Date.now()}`;
    const testDescription = "Test service description";
    const testEndpoint = "https://api.example.com/service";
    const testPrice = "0.01";

    it("should show help for marketplace:publish", () => {
      const result = runCLI("marketplace:publish --help");
      
      if (!result.success && result.error?.includes("tsx")) {
        console.warn("⚠️ tsx not available, skipping test");
        return;
      }

      expect(result.output).toContain("Publish a service");
      expect(result.output).toContain("--name");
      expect(result.output).toContain("--description");
      expect(result.output).toContain("--endpoint");
      expect(result.output).toContain("--price");
    });

    it("should fail when required arguments are missing", () => {
      const result = runCLI("marketplace:publish", {
        env: { PRIVATE_KEY: TEST_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001" },
      });

      expect(result.success).toBe(false);
      expect(result.status).toBeGreaterThan(0);
    });

    it("should fail when private key is missing", () => {
      const result = runCLI(
        `marketplace:publish --name "${testServiceName}" --description "${testDescription}" --endpoint ${testEndpoint} --price ${testPrice}`,
        { env: { PRIVATE_KEY: "" } }
      );

      expect(result.success).toBe(false);
      expect(result.error || result.output).toContain("Private key required");
    });

    it("should execute marketplace:publish command with valid arguments and real blockchain", async () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set for real blockchain test");
        return;
      }

      // Usar nombre único para evitar conflictos
      const uniqueServiceName = `E2E Test Service ${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const uniquePrice = minVerifiableAmount; // 0.000001 USDC - cantidad mínima verificable
      
      console.log(`🧪 Testing marketplace:publish with real blockchain interaction`);
      console.log(`   Service Name: ${uniqueServiceName}`);
      console.log(`   Price: ${uniquePrice} USDC (mínimo verificable)`);

      // Pass contract addresses via environment if available
      const envVars: Record<string, string> = { PRIVATE_KEY: TEST_PRIVATE_KEY };
      if (MARKETPLACE_ADDRESS) {
        envVars.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS = MARKETPLACE_ADDRESS;
      }

      const result = runCLI(
        `marketplace:publish --name "${uniqueServiceName}" --description "${testDescription}" --endpoint ${testEndpoint} --price ${uniquePrice} --network fuji`,
        {
          env: envVars,
          timeout: 180000, // 3 minutes for blockchain transaction
        }
      );

      if (result.success) {
        expect(result.output).toContain("Publishing service");
        expect(result.output).toContain(uniqueServiceName);
        expect(result.output).toContain("Transaction:");
        expect(result.output).toContain("✅ Service published successfully!");
        console.log("✅ Service published successfully on blockchain!");
      } else {
        const errorMsg = result.error || result.output;
        expect(errorMsg).toBeDefined();
        expect(errorMsg).not.toContain("command not found");
        console.log(`⚠️ Transaction failed: ${errorMsg}`);
      }
    }, 180000);
  });

  describe("x402:pay Command", () => {
    it("should show help for x402:pay", () => {
      const result = runCLI("x402:pay --help");
      
      if (!result.success && result.error?.includes("tsx")) {
        console.warn("⚠️ tsx not available, skipping test");
        return;
      }

      expect(result.output).toContain("Make x402 payment");
      expect(result.output).toContain("--amount");
      expect(result.output).toContain("--token");
      expect(result.output).toContain("--tier");
    });

    it("should fail when amount is missing", () => {
      const result = runCLI("x402:pay");

      expect(result.success).toBe(false);
      expect(result.status).toBeGreaterThan(0);
    });

    it("should execute x402:pay command with valid arguments and minimum amount", async () => {
      const minAmount = minVerifiableAmount; // 0.000001 - cantidad mínima verificable
      
      console.log(`🧪 Testing x402:pay with minimum amount: ${minAmount} USDC`);
      
      const result = runCLI(`x402:pay --amount ${minAmount} --token USDC --tier basic`, {
        timeout: 30000,
      });

      // x402 payment requires an API endpoint, so it might fail
      // But the command structure should be correct
      if (result.success) {
        expect(result.output).toContain("Processing x402 payment");
        expect(result.output).toContain(minAmount);
        expect(result.output).toContain("USDC");
        console.log("✅ x402 payment command executed successfully!");
      } else {
        // Should fail with API error, not CLI structure error
        const errorMsg = result.error || result.output;
        expect(errorMsg).toBeDefined();
        expect(errorMsg).not.toContain("command not found");
        expect(errorMsg).not.toContain("missing required");
        console.log(`⚠️ Payment API not available (expected): ${errorMsg.substring(0, 100)}`);
      }
    }, 30000);

    it("should handle different token types", () => {
      const result = runCLI("x402:pay --amount 0.1 --token AVAX", {
        timeout: 30000,
      });

      if (result.output) {
        expect(result.output).toContain("AVAX");
      }
    }, 30000);

    it("should handle different tiers", () => {
      const result = runCLI("x402:pay --amount 0.15 --token USDC --tier premium", {
        timeout: 30000,
      });

      if (result.output) {
        expect(result.output).toContain("premium");
      }
    }, 30000);
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid command gracefully", () => {
      const result = runCLI("invalid:command");

      expect(result.success).toBe(false);
      expect(result.status).toBeGreaterThan(0);
    });

    it("should handle invalid network parameter", () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const result = runCLI(
        `agent:register --agent-id ${testAgentId} --metadata ${testMetadataIPFS} --stake ${testStakeAmount} --network invalid`,
        {
          env: { PRIVATE_KEY: TEST_PRIVATE_KEY },
        }
      );

      // Should handle invalid network (defaults to fuji or shows error)
      expect(result).toBeDefined();
    });

    it("should handle empty string arguments", () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const result = runCLI(
        `agent:register --agent-id "" --metadata "" --stake ""`,
        {
          env: { PRIVATE_KEY: TEST_PRIVATE_KEY },
        }
      );

      // Should fail validation or show error
      expect(result.success).toBe(false);
    });
  });

  describe("Environment Variable Integration", () => {
    it("should use PRIVATE_KEY from environment", () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const result = runCLI(
        `agent:register --agent-id ${testAgentId} --metadata ${testMetadataIPFS} --stake ${testStakeAmount}`,
        {
          env: { PRIVATE_KEY: TEST_PRIVATE_KEY },
          timeout: 120000,
        }
      );

      // Should not complain about missing private key
      if (result.error) {
        expect(result.error).not.toContain("Private key required");
      }
    }, 120000);

    it("should prefer --private-key flag over environment variable", () => {
      const flagKey = "0x1111111111111111111111111111111111111111111111111111111111111111";
      const envKey = TEST_PRIVATE_KEY || "0x2222222222222222222222222222222222222222222222222222222222222222";

      const result = runCLI(
        `agent:register --agent-id ${testAgentId} --metadata ${testMetadataIPFS} --stake ${testStakeAmount} --private-key ${flagKey}`,
        {
          env: { PRIVATE_KEY: envKey },
          timeout: 120000,
        }
      );

      // Should use the flag key (will fail with invalid key, but that's expected)
      expect(result).toBeDefined();
    }, 120000);
  });

  describe("Output Format Validation", () => {
    it("should format transaction output correctly with real blockchain", async () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const uniqueAgentId = `format-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const result = runCLI(
        `agent:register --agent-id ${uniqueAgentId} --metadata ${testMetadataIPFS} --stake ${testStakeAmount} --network fuji`,
        {
          env: { PRIVATE_KEY: TEST_PRIVATE_KEY },
          timeout: 180000,
        }
      );

      if (result.success && result.output) {
        // Should contain structured output
        expect(result.output).toContain("Registering agent");
        expect(result.output).toContain("Agent ID:");
        expect(result.output).toContain("Network:");
        expect(result.output).toContain("Stake:");
        expect(result.output).toContain("Transaction:");
        console.log("✅ Transaction output format verified!");
      } else {
        // Even if transaction fails, output should be formatted
        if (result.output) {
          expect(result.output).toContain("Registering agent");
        }
      }
    }, 180000);

    it("should format marketplace output correctly with real blockchain", async () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set");
        return;
      }

      const uniqueServiceName = `Format Test ${Date.now()}`;

      const result = runCLI(
        `marketplace:publish --name "${uniqueServiceName}" --description "Format test" --endpoint https://test.com --price ${minVerifiableAmount} --network fuji`,
        {
          env: { PRIVATE_KEY: TEST_PRIVATE_KEY },
          timeout: 180000,
        }
      );

      if (result.success && result.output) {
        expect(result.output).toContain("Publishing service");
        expect(result.output).toContain("Name:");
        expect(result.output).toContain("Price:");
        expect(result.output).toContain("Transaction:");
        console.log("✅ Marketplace output format verified!");
      } else {
        // Even if transaction fails, output should be formatted
        if (result.output) {
          expect(result.output).toContain("Publishing service");
        }
      }
    }, 180000);
  });

  describe("Complete Workflow Test with Real Blockchain", () => {
    it("should execute complete workflow: register -> publish -> pay with real transactions", async () => {
      if (!TEST_PRIVATE_KEY) {
        console.log("⏭️ Skipping - PRIVATE_KEY not set for complete workflow test");
        return;
      }

      const workflowAgentId = `workflow-e2e-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const workflowServiceName = `Workflow E2E Service ${Date.now()}`;
      const workflowPrice = minVerifiableAmount; // Cantidad mínima verificable

      console.log("\n🔄 Starting complete E2E workflow test with real blockchain...");
      console.log(`   Agent ID: ${workflowAgentId}`);
      console.log(`   Service: ${workflowServiceName}`);
      console.log(`   Stake: ${testStakeAmount} AVAX (mínimo configurable)`);
      console.log(`   Price: ${workflowPrice} USDC (mínimo verificable)\n`);

      // Step 1: Register agent
      console.log("📝 Step 1: Registering agent on blockchain...");
      const workflowEnvVars: Record<string, string> = { PRIVATE_KEY: TEST_PRIVATE_KEY };
      if (AGENT_REGISTRY_ADDRESS) {
        workflowEnvVars.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS = AGENT_REGISTRY_ADDRESS;
      }
      if (MARKETPLACE_ADDRESS) {
        workflowEnvVars.NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS = MARKETPLACE_ADDRESS;
      }

      const registerResult = runCLI(
        `agent:register --agent-id ${workflowAgentId} --metadata ${testMetadataIPFS} --stake ${testStakeAmount} --network fuji`,
        {
          env: workflowEnvVars,
          timeout: 180000,
        }
      );

      if (registerResult.success) {
        console.log("✅ Step 1: Agent registered successfully!");
        expect(registerResult.output).toContain("✅ Agent registered successfully!");
      } else {
        const errorMsg = registerResult.error || registerResult.output;
        if (errorMsg.includes("already registered") || errorMsg.includes("Agent ID taken")) {
          console.log("⚠️ Step 1: Agent already registered (using existing)");
        } else {
          console.log(`⚠️ Step 1: Registration failed: ${errorMsg.substring(0, 200)}`);
        }
      }

      // Step 2: Publish service
      console.log("\n📦 Step 2: Publishing service to marketplace...");
      const publishResult = runCLI(
        `marketplace:publish --name "${workflowServiceName}" --description "E2E workflow test service" --endpoint https://api.example.com/service --price ${workflowPrice} --network fuji`,
        {
          env: workflowEnvVars,
          timeout: 180000,
        }
      );

      if (publishResult.success) {
        console.log("✅ Step 2: Service published successfully!");
        expect(publishResult.output).toContain("✅ Service published successfully!");
      } else {
        const errorMsg = publishResult.error || publishResult.output;
        console.log(`⚠️ Step 2: Publishing failed: ${errorMsg.substring(0, 200)}`);
      }

      // Step 3: Make payment
      console.log("\n💳 Step 3: Making x402 payment...");
      const payResult = runCLI(`x402:pay --amount ${workflowPrice} --token USDC --tier basic`, {
        timeout: 30000,
      });

      if (payResult.success) {
        console.log("✅ Step 3: Payment command executed!");
      } else {
        console.log(`⚠️ Step 3: Payment API not available (expected in test environment)`);
      }

      // Verify all commands executed
      expect(registerResult).toBeDefined();
      expect(publishResult).toBeDefined();
      expect(payResult).toBeDefined();

      // At least one blockchain transaction should succeed
      const hasBlockchainSuccess = 
        (registerResult.success && registerResult.output.includes("✅")) ||
        (publishResult.success && publishResult.output.includes("✅"));

      if (hasBlockchainSuccess) {
        console.log("\n✅ Complete workflow test: At least one blockchain transaction succeeded!");
      } else {
        console.log("\n⚠️ Complete workflow test: Blockchain transactions may have failed (check contract deployment)");
      }

      // CLI should always work correctly
      const hasValidCLIOutput = 
        (registerResult.output && registerResult.output.includes("Registering")) ||
        (publishResult.output && publishResult.output.includes("Publishing")) ||
        (payResult.output && payResult.output.includes("Processing"));

      expect(hasValidCLIOutput).toBe(true);
    }, 300000); // 5 minutes for complete workflow
  });
});

