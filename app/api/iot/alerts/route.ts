// IoT Alerts API with x402 Payment
// Endpoint to receive alerts from IoT devices with x402 payment

import { NextRequest, NextResponse } from "next/server";

// Lazy import to avoid build-time errors if x402 is not configured
async function verifyX402Payment(req: NextRequest) {
  try {
    const { verifyX402Payment: verify } = await import("@/lib/x402/middleware");
    return await verify(req);
  } catch (error) {
    // If x402 middleware fails to load (e.g., missing env vars), allow request to continue
    console.warn("x402 payment verification skipped:", error);
    return { paid: false, required: false, verified: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify x402 payment (optional, may be required)
    const paymentResult = await verifyX402Payment(req);
    
    // If payment is required but failed, return error
    if (paymentResult.required && !paymentResult.verified) {
      return NextResponse.json(
        {
          error: "Payment required",
          message: "This endpoint requires x402 payment",
          paymentUrl: paymentResult.paymentUrl,
        },
        { status: 402 }
      );
    }

    // Parse alert data first (only once)
    const alertData = await req.json();
    
    // Get agent ID from header or body
    const agentId = req.headers.get("X-Agent-ID") || alertData.agentId;
    
    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID required" },
        { status: 400 }
      );
    }
    
    // Validate basic data
    if (!alertData || typeof alertData !== "object") {
      return NextResponse.json(
        { error: "Invalid alert data" },
        { status: 400 }
      );
    }

    // Agregar metadata
    const enrichedAlert = {
      ...alertData,
      agentId,
      timestamp: Date.now(),
      receivedAt: new Date().toISOString(),
      paymentVerified: paymentResult.verified || false,
      txHash: paymentResult.transactionHash || paymentResult.txHash,
    };

    // Here you could:
    // - Save to database
    // - Send notifications (email, SMS, push)
    // - Trigger webhooks
    // - Integrate with monitoring systems
    console.log("Alert received:", enrichedAlert);

    // Example: If it's a high temperature alert
    if (alertData.alert === "high_temperature" && alertData.temperature) {
      console.warn(`⚠️ High temperature alert from ${agentId}: ${alertData.temperature}°C`);
    }

    return NextResponse.json({
      success: true,
      message: "Alert received and processed",
      alert: enrichedAlert,
      txHash: paymentResult.txHash,
    });
  } catch (error) {
    console.error("Error processing alert:", error);
    return NextResponse.json(
      {
        error: "Failed to process alert",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

