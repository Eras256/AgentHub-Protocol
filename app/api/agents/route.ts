import { NextRequest, NextResponse } from "next/server";

// Mock agents API - replace with actual contract calls
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  // TODO: Fetch from AgentRegistry contract
  const agents = [
    {
      address: "0x123...",
      agentId: "0xabc...",
      trustScore: 7500,
      totalTransactions: 100,
      successfulTransactions: 85,
      stakedAmount: "5.0",
      isActive: true,
    },
  ];

  if (address) {
    const filtered = agents.filter((a) => a.address === address);
    return NextResponse.json(filtered);
  }

  return NextResponse.json(agents);
}

