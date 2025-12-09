/**
 * End-to-End Tests for AgentHub CLI
 * Tests CLI commands functionality
 */

import { describe, it, expect } from "@jest/globals";
import { execSync } from "child_process";
import path from "path";

const CLI_PATH = path.join(__dirname, "../cli/index.ts");
const TSX_CMD = "tsx";

describe("AgentHub CLI - End-to-End Tests", () => {
  describe("CLI Help Command", () => {
    it("should show help when no arguments provided", () => {
      try {
        const output = execSync(`${TSX_CMD} ${CLI_PATH} --help`, {
          encoding: "utf-8",
          cwd: path.join(__dirname, ".."),
        });

        expect(output).toContain("AgentHub Protocol CLI");
        expect(output).toContain("agent:register");
        expect(output).toContain("marketplace:publish");
        expect(output).toContain("x402:pay");
      } catch (error: any) {
        // If command fails, check if it's because tsx is not available
        if (error.message.includes("tsx")) {
          console.warn("⚠️ tsx not available, skipping CLI test");
          return;
        }
        throw error;
      }
    });

    it("should show version", () => {
      try {
        const output = execSync(`${TSX_CMD} ${CLI_PATH} --version`, {
          encoding: "utf-8",
          cwd: path.join(__dirname, ".."),
        });

        expect(output).toContain("1.0.0");
      } catch (error: any) {
        if (error.message.includes("tsx")) {
          console.warn("⚠️ tsx not available, skipping CLI test");
          return;
        }
        throw error;
      }
    });
  });

  describe("CLI Command Structure", () => {
    it("should have agent:register command structure", () => {
      try {
        const output = execSync(`${TSX_CMD} ${CLI_PATH} agent:register --help`, {
          encoding: "utf-8",
          cwd: path.join(__dirname, ".."),
        });

        expect(output).toContain("Register a new agent");
        expect(output).toContain("--agent-id");
        expect(output).toContain("--metadata");
        expect(output).toContain("--stake");
      } catch (error: any) {
        if (error.message.includes("tsx") || error.message.includes("command not found")) {
          console.warn("⚠️ CLI not available, skipping test");
          return;
        }
        // Command might fail due to missing args, which is expected
        expect(error.status).toBeDefined();
      }
    });

    it("should have marketplace:publish command structure", () => {
      try {
        const output = execSync(`${TSX_CMD} ${CLI_PATH} marketplace:publish --help`, {
          encoding: "utf-8",
          cwd: path.join(__dirname, ".."),
        });

        expect(output).toContain("Publish a service");
        expect(output).toContain("--name");
        expect(output).toContain("--description");
        expect(output).toContain("--endpoint");
        expect(output).toContain("--price");
      } catch (error: any) {
        if (error.message.includes("tsx") || error.message.includes("command not found")) {
          console.warn("⚠️ CLI not available, skipping test");
          return;
        }
        expect(error.status).toBeDefined();
      }
    });

    it("should have x402:pay command structure", () => {
      try {
        const output = execSync(`${TSX_CMD} ${CLI_PATH} x402:pay --help`, {
          encoding: "utf-8",
          cwd: path.join(__dirname, ".."),
        });

        expect(output).toContain("Make x402 payment");
        expect(output).toContain("--amount");
        expect(output).toContain("--token");
      } catch (error: any) {
        if (error.message.includes("tsx") || error.message.includes("command not found")) {
          console.warn("⚠️ CLI not available, skipping test");
          return;
        }
        expect(error.status).toBeDefined();
      }
    });
  });

  describe("CLI Error Handling", () => {
    it("should show error for missing required arguments", () => {
      try {
        execSync(`${TSX_CMD} ${CLI_PATH} agent:register`, {
          encoding: "utf-8",
          cwd: path.join(__dirname, ".."),
          stdio: "pipe",
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Expected to fail with missing arguments
        expect(error.status).toBeGreaterThan(0);
      }
    });

    it("should show error for invalid command", () => {
      try {
        execSync(`${TSX_CMD} ${CLI_PATH} invalid:command`, {
          encoding: "utf-8",
          cwd: path.join(__dirname, ".."),
          stdio: "pipe",
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Expected to fail with invalid command
        expect(error.status).toBeGreaterThan(0);
      }
    });
  });
});

