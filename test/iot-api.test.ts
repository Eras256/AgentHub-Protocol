/**
 * Tests for IoT API endpoints
 * Tests for /api/iot/sensors and /api/iot/alerts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";
import type { X402PaymentResult } from "@/lib/x402/middleware";

// Mock the x402 middleware
const mockVerifyX402Payment = jest.fn<(...args: any[]) => Promise<X402PaymentResult>>();
jest.mock("@/lib/x402/middleware", () => ({
  verifyX402Payment: (...args: any[]) => mockVerifyX402Payment(...args),
}));

describe("IoT API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyX402Payment.mockReset();
  });

  describe("POST /api/iot/sensors", () => {
    it("should accept sensor data with agent ID header", async () => {
      const { POST } = await import("@/app/api/iot/sensors/route");
      
      const request = new NextRequest("http://localhost:3000/api/iot/sensors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-ID": "test-iot-agent-001",
        },
        body: JSON.stringify({
          temperature: 25.5,
          humidity: 60,
          pressure: 1013.25,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.agentId).toBe("test-iot-agent-001");
      expect(data.data.temperature).toBe(25.5);
    });

    it("should reject request without agent ID", async () => {
      const { POST } = await import("@/app/api/iot/sensors/route");
      
      const request = new NextRequest("http://localhost:3000/api/iot/sensors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: 25.5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("X-Agent-ID");
    });

    it("should reject invalid sensor data", async () => {
      const { POST } = await import("@/app/api/iot/sensors/route");
      
      const request = new NextRequest("http://localhost:3000/api/iot/sensors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-ID": "test-iot-agent-001",
        },
        body: "invalid json",
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });

    it("should handle GET request for querying sensor data", async () => {
      const { GET } = await import("@/app/api/iot/sensors/route");
      
      const request = new NextRequest(
        "http://localhost:3000/api/iot/sensors?agentId=test-iot-agent-001",
        {
          method: "GET",
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.agentId).toBe("test-iot-agent-001");
    });
  });

  describe("POST /api/iot/alerts", () => {
    it("should accept alert with x402 payment verification", async () => {
      mockVerifyX402Payment.mockResolvedValue({
        paid: true,
        verified: true,
        transactionHash: "0x123...",
      });

      const { POST } = await import("@/app/api/iot/alerts/route");
      
      const request = new NextRequest("http://localhost:3000/api/iot/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-ID": "test-iot-agent-001",
        },
        body: JSON.stringify({
          agentId: "test-iot-agent-001",
          alert: "high_temperature",
          temperature: 35.0,
          threshold: 30.0,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alert.agentId).toBe("test-iot-agent-001");
      expect(data.alert.alert).toBe("high_temperature");
      expect(data.alert.paymentVerified).toBe(true);
    });

    it("should reject alert without payment when required", async () => {
      mockVerifyX402Payment.mockResolvedValue({
        paid: false,
        required: true,
        verified: false,
      });

      const { POST } = await import("@/app/api/iot/alerts/route");
      
      const request = new NextRequest("http://localhost:3000/api/iot/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: "test-iot-agent-001",
          alert: "high_temperature",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toContain("Payment required");
    });

    it("should accept alert without payment when not required", async () => {
      mockVerifyX402Payment.mockResolvedValue({
        paid: false,
        verified: false,
      });

      const { POST } = await import("@/app/api/iot/alerts/route");
      
      const request = new NextRequest("http://localhost:3000/api/iot/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-ID": "test-iot-agent-001",
        },
        body: JSON.stringify({
          agentId: "test-iot-agent-001",
          alert: "low_temperature",
          temperature: 15.0,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle high temperature alerts specifically", async () => {
      mockVerifyX402Payment.mockResolvedValue({
        paid: false,
        verified: false,
      });

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const { POST } = await import("@/app/api/iot/alerts/route");
      
      const request = new NextRequest("http://localhost:3000/api/iot/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-ID": "test-iot-agent-001",
        },
        body: JSON.stringify({
          agentId: "test-iot-agent-001",
          alert: "high_temperature",
          temperature: 35.0,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("High temperature alert")
      );

      consoleWarnSpy.mockRestore();
    });
  });
});

