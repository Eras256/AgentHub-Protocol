// IoT Sensor Data API
// Endpoint to receive sensor data from IoT devices

import { NextRequest, NextResponse } from "next/server";
import { verifyX402Payment } from "@/lib/x402/middleware";

// In-memory storage for sensor data (in production, use a database)
const sensorDataStore = new Map<string, any[]>();

// Helper function to store sensor data
function storeSensorData(agentId: string, data: any) {
  if (!sensorDataStore.has(agentId)) {
    sensorDataStore.set(agentId, []);
  }
  const agentData = sensorDataStore.get(agentId)!;
  agentData.push(data);
  // Keep only last 100 readings per agent
  if (agentData.length > 100) {
    agentData.shift();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get agent ID from header
    const agentId = req.headers.get("X-Agent-ID");
    
    if (!agentId) {
      return NextResponse.json(
        { error: "X-Agent-ID header required" },
        { status: 400 }
      );
    }

    // Parse sensor data
    const sensorData = await req.json();
    
    // Validate basic data
    if (!sensorData || typeof sensorData !== "object") {
      return NextResponse.json(
        { error: "Invalid sensor data" },
        { status: 400 }
      );
    }

    // Add metadata
    const enrichedData = {
      ...sensorData,
      agentId,
      timestamp: Date.now(),
      receivedAt: new Date().toISOString(),
    };

    // Store sensor data (in production, save to database)
    storeSensorData(agentId, enrichedData);
    
    // Here you could also send to webhooks, etc.
    console.log("Sensor data received:", enrichedData);

    return NextResponse.json({
      success: true,
      message: "Sensor data received",
      data: enrichedData,
    });
  } catch (error) {
    console.error("Error processing sensor data:", error);
    return NextResponse.json(
      {
        error: "Failed to process sensor data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET to query sensor data (optional, requires authentication)
export async function GET(req: NextRequest) {
  try {
    const agentId = req.nextUrl.searchParams.get("agentId");
    
    if (!agentId) {
      return NextResponse.json(
        { error: "agentId query parameter required" },
        { status: 400 }
      );
    }

    // Get stored sensor data (in production, query database)
    const storedData = sensorDataStore.get(agentId) || [];
    
    return NextResponse.json({
      success: true,
      agentId,
      message: "Sensor data retrieved",
      data: storedData,
      count: storedData.length,
    });
  } catch (error) {
    console.error("Error querying sensor data:", error);
    return NextResponse.json(
      {
        error: "Failed to query sensor data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

