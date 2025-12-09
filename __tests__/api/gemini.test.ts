/**
 * Tests for Gemini AI Integration
 * Run with: npm test or pnpm test
 */

import { describe, it, expect, beforeAll } from "@jest/globals";

describe("Gemini AI Integration Tests", () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  beforeAll(() => {
    if (!API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY not set. Some tests may fail.");
    }
  });

  describe("Test Endpoint", () => {
    it("should return success when API key is configured", async () => {
      if (!API_KEY) {
        console.log("⏭️ Skipping test - API key not configured");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/test-gemini`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.modelUsed).toBeDefined();
      console.log(`✅ Test passed - Model used: ${data.modelUsed}`);
    }, 30000); // 30 second timeout

    it("should handle custom prompts via POST", async () => {
      if (!API_KEY) {
        console.log("⏭️ Skipping test - API key not configured");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/test-gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Say 'Hello from Gemini' in JSON format: {message: 'your message'}",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      console.log(`✅ POST test passed - Response:`, data.data);
    }, 30000);
  });

  describe("Chat Endpoint", () => {
    it("should respond to chat messages", async () => {
      if (!API_KEY) {
        console.log("⏭️ Skipping test - API key not configured");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "Hello, can you help me understand AgentHub Protocol?",
            },
          ],
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.content).toBeDefined();
      expect(data.content.length).toBeGreaterThan(0);
      expect(data.model).toBeDefined();
      console.log(`✅ Chat test passed - Model: ${data.model}`);
      console.log(`   Response preview: ${data.content.substring(0, 100)}...`);
    }, 30000);
  });

  describe("DeFi Strategy Optimization", () => {
    it("should generate DeFi strategy recommendations", async () => {
      if (!API_KEY) {
        console.log("⏭️ Skipping test - API key not configured");
        return;
      }

      // Import the function directly
      const { optimizeDeFiStrategy } = await import("@/lib/ai/gemini");

      const portfolio = {
        benqi: { balance: 1000, apy: 8.5 },
        traderJoe: { balance: 500, apy: 11.2 },
        aave: { balance: 300, apy: 7.8 },
      };

      const protocols = ["Trader Joe", "Benqi", "Aave"];

      const result = await optimizeDeFiStrategy(portfolio, protocols);

      expect(result).toBeDefined();
      expect(result.strategy).toBeDefined();
      expect(result.allocations).toBeDefined();
      expect(result.expectedYield).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      console.log(`✅ DeFi optimization test passed`);
      console.log(`   Strategy: ${result.strategy.substring(0, 100)}...`);
      console.log(`   Expected Yield: ${result.expectedYield}%`);
    }, 45000); // Longer timeout for complex operations
  });

  describe("Error Handling", () => {
    it("should handle missing API key gracefully", async () => {
      // This test checks the error handling when API key is missing
      // We'll mock the environment temporarily
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_GEMINI_API_KEY;

      try {
        const { generateContentWithFallback } = await import("@/lib/ai/gemini");
        await expect(
          generateContentWithFallback("Test prompt")
        ).rejects.toThrow();
      } finally {
        // Restore original key
        if (originalKey) {
          process.env.GEMINI_API_KEY = originalKey;
        }
      }
    });
  });
});

