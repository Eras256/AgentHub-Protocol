/**
 * Utility Functions Tests
 * Tests formatters and validation utilities
 */

import { describe, it, expect } from "@jest/globals";
import {
  formatAddress,
  formatCurrency,
  formatTrustScore,
  formatDate,
} from "../src/utils/formatters";
import {
  isValidAddress,
  isValidAgentId,
  isValidIPFSHash,
  validateStakeAmount,
} from "../src/utils/validation";

describe("Utility Functions", () => {
  describe("Formatters", () => {
    describe("formatAddress", () => {
      it("should format address with default chars", () => {
        const address = "0x1234567890123456789012345678901234567890";
        const formatted = formatAddress(address);
        expect(formatted).toBe("0x1234...7890");
      });

      it("should format address with custom chars", () => {
        const address = "0x1234567890123456789012345678901234567890";
        const formatted = formatAddress(address, 6);
        expect(formatted).toBe("0x123456...567890");
      });

      it("should handle empty address", () => {
        const formatted = formatAddress("");
        expect(formatted).toBe("");
      });

      it("should handle short address", () => {
        const address = "0x1234";
        const formatted = formatAddress(address);
        // Short addresses will still be formatted with ellipsis
        expect(formatted).toContain("0x");
      });
    });

    describe("formatCurrency", () => {
      it("should format currency with default decimals and symbol", () => {
        const amount = BigInt("1000000000000000000"); // 1 AVAX
        const formatted = formatCurrency(amount);
        expect(formatted).toBe("1.0000 AVAX");
      });

      it("should format currency with custom decimals", () => {
        const amount = BigInt("1000000"); // 1 USDC (6 decimals)
        const formatted = formatCurrency(amount, 6, "USDC");
        expect(formatted).toBe("1.0000 USDC");
      });

      it("should format currency with string amount", () => {
        const formatted = formatCurrency("1000000000000000000", 18, "AVAX");
        expect(formatted).toBe("1.0000 AVAX");
      });

      it("should format small amounts", () => {
        const amount = BigInt("1000000000000"); // 0.000001 AVAX
        const formatted = formatCurrency(amount);
        expect(formatted).toBe("0.0000 AVAX");
      });
    });

    describe("formatTrustScore", () => {
      it("should format trust score from bigint", () => {
        const score = BigInt(8500); // 85.00%
        const formatted = formatTrustScore(score);
        expect(formatted).toBe("85.00%");
      });

      it("should format trust score from number", () => {
        const formatted = formatTrustScore(7500);
        expect(formatted).toBe("75.00%");
      });

      it("should format zero trust score", () => {
        const formatted = formatTrustScore(0);
        expect(formatted).toBe("0.00%");
      });

      it("should format maximum trust score", () => {
        const formatted = formatTrustScore(10000);
        expect(formatted).toBe("100.00%");
      });
    });

    describe("formatDate", () => {
      it("should format date from bigint timestamp", () => {
        const timestamp = BigInt(1704067200); // Unix timestamp
        const formatted = formatDate(timestamp);
        expect(formatted).toMatch(/\w{3} \d{1,2}, \d{4}/);
      });

      it("should format date from number timestamp", () => {
        const timestamp = 1704067200;
        const formatted = formatDate(timestamp);
        expect(formatted).toMatch(/\w{3} \d{1,2}, \d{4}/);
      });

      it("should format current date", () => {
        const timestamp = Math.floor(Date.now() / 1000);
        const formatted = formatDate(timestamp);
        expect(formatted).toMatch(/\w{3} \d{1,2}, \d{4}/);
      });
    });
  });

  describe("Validation", () => {
    describe("isValidAddress", () => {
      it("should validate correct Ethereum address", () => {
        const address = "0x1234567890123456789012345678901234567890";
        expect(isValidAddress(address)).toBe(true);
      });

      it("should reject invalid address format", () => {
        expect(isValidAddress("0x123")).toBe(false);
        expect(isValidAddress("1234567890123456789012345678901234567890")).toBe(false);
        expect(isValidAddress("")).toBe(false);
      });

      it("should reject address with invalid characters", () => {
        expect(isValidAddress("0x123456789012345678901234567890123456789g")).toBe(false);
      });

      it("should validate lowercase address", () => {
        const address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
        expect(isValidAddress(address)).toBe(true);
      });

      it("should validate uppercase address", () => {
        const address = "0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD";
        expect(isValidAddress(address)).toBe(true);
      });
    });

    describe("isValidAgentId", () => {
      it("should validate valid agent ID", () => {
        expect(isValidAgentId("agent-123")).toBe(true);
        expect(isValidAgentId("a")).toBe(true);
        expect(isValidAgentId("a".repeat(64))).toBe(true);
      });

      it("should reject empty agent ID", () => {
        expect(isValidAgentId("")).toBe(false);
      });

      it("should reject agent ID that is too long", () => {
        expect(isValidAgentId("a".repeat(65))).toBe(false);
      });
    });

    describe("isValidIPFSHash", () => {
      it("should validate CID v0 hash", () => {
        const hash = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o";
        expect(isValidIPFSHash(hash)).toBe(true);
      });

      it("should validate IPFS URL", () => {
        const hash = "ipfs://QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o";
        expect(isValidIPFSHash(hash)).toBe(true);
      });

      it("should validate CID v1 hash", () => {
        const hash = "bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";
        expect(isValidIPFSHash(hash)).toBe(true);
      });

      it("should reject invalid IPFS hash", () => {
        expect(isValidIPFSHash("invalid")).toBe(false);
        expect(isValidIPFSHash("")).toBe(false);
        expect(isValidIPFSHash("Qm123")).toBe(false); // Too short
      });
    });

    describe("validateStakeAmount", () => {
      it("should validate minimum stake amount", () => {
        expect(validateStakeAmount("1.0")).toBe(true);
        expect(validateStakeAmount("1")).toBe(true);
        expect(validateStakeAmount("10.5")).toBe(true);
      });

      it("should reject amount below minimum", () => {
        expect(validateStakeAmount("0.5")).toBe(false);
        expect(validateStakeAmount("0")).toBe(false);
        expect(validateStakeAmount("-1")).toBe(false);
      });

      it("should reject invalid number format", () => {
        expect(validateStakeAmount("abc")).toBe(false);
        expect(validateStakeAmount("")).toBe(false);
        expect(validateStakeAmount("NaN")).toBe(false);
      });
    });
  });
});

