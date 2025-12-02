# Kite Chain Integration Guide

**Kite Chain: The first AI payment blockchain** - Foundational infrastructure empowering autonomous agents to operate and transact with identity, payment, governance, and verification.

**Official Documentation:** [https://docs.gokite.ai/](https://docs.gokite.ai/)

## What is Kite Chain?

Kite Chain is a sovereign Layer-1 blockchain designed specifically for AI-centric applications, offering:

- **Cryptographic Identity**: 3-tier identity system for fine-grained governance
- **Native Stablecoin Payments**: Built-in USDC support for instant settlements
- **x402 Compatible**: Support for agent-to-agent (A2A) intents and verifiable message passing
- **Agent-First Design**: Purpose-built for autonomous agent operations
- **Verifiable Delegation**: Cryptographic proof of payment authority
- **High Performance**: Fast, scalable blockchain infrastructure

## Network Information

### Kite Chain Testnet

- **Chain Name**: KiteAI Testnet
- **Chain ID**: 2368
- **RPC URL**: `https://rpc-testnet.gokite.ai/`
- **Block Explorer**: `https://testnet.kitescan.ai/`
- **Faucet**: `https://faucet.gokite.ai`
- **Token**: KITE

### Kite Chain Mainnet

Coming soon.

**Reference:** [Network Information](https://docs.gokite.ai/kite-chain/1-getting-started/network-information)

## Integration with AgentHub Protocol

AgentHub Protocol uses Kite Chain for:

1. **Proof of Attributed Intelligence (PoAI)**: On-chain verification of AI decisions
2. **Agent Identity**: Cryptographic identity for autonomous agents
3. **Cross-Agent Collaboration**: Agent-to-agent (A2A) communication
4. **Verifiable Delegation**: Proof of payment authority

### Architecture

```
┌────────────────────────────────────────────────┐
│  AgentHub Protocol (Avalanche)                 │
│  ├─ AgentRegistry (ERC-8004)                  │
│  ├─ ServiceMarketplace (x402)                  │
│  └─ RevenueDistributor                         │
├────────────────────────────────────────────────┤
│  Kite Chain (Layer-1)                          │
│  ├─ PoAI Verification (On-chain)              │
│  ├─ Agent Identity (3-tier)                    │
│  ├─ A2A Communication (x402 compatible)       │
│  └─ Verifiable Delegation                      │
└────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Kite Chain Configuration
KITE_RPC_URL=https://rpc-testnet.gokite.ai/
KITE_API_KEY=your_kite_api_key
KITE_AGENT_ADDRESS=your_agent_wallet_address
KITE_POAI_CONTRACT_ADDRESS=poai_contract_address
```

### Hardhat Configuration

Kite Chain testnet is already configured in `hardhat.config.ts`:

```typescript
kiteTestnet: {
  url: "https://rpc-testnet.gokite.ai/",
  chainId: 2368,
  // ...
}
```

Deploy to Kite Chain testnet:

```bash
pnpm hardhat run scripts/deploy.ts --network kiteTestnet
```

## Usage in AgentHub

### PoAI Submission

```typescript
import { submitPoAI, KITE_NETWORKS } from "@/lib/kite/agent";

// After Gemini makes a decision
const proof = generatePoAI({
  agentId: "agent-001",
  decision: "Swap 30% AVAX to USDC",
  reasoning: "Price target reached",
  timestamp: Date.now(),
  model: "gemini-pro",
  confidence: 87,
  inputs: { price: 45.2, target: 45.0 }
});

// Submit to Kite Chain for on-chain verification
const { txHash } = await submitPoAI(proof);

// View on explorer
console.log(`PoAI verified: ${KITE_NETWORKS.testnet.explorer}/tx/${txHash}`);
```

### Agent Registration on Kite Chain

```typescript
import { createKiteAgent } from "@/lib/kite/agent";

// Register agent on Kite Chain
const agent = await createKiteAgent("DeFi Optimizer", [
  "portfolio_optimization",
  "risk_management",
  "autonomous_trading"
]);
```

## Key Features

### 1. Cryptographic Identity (3-tier)

Kite Chain provides a 3-tier identity system:
- **Tier 1**: Basic agent identity
- **Tier 2**: Enhanced identity with capabilities
- **Tier 3**: Full identity with governance rights

### 2. Native USDC Payments

Built-in USDC support enables:
- Instant settlements
- Low transaction costs
- Stable value for agent operations

### 3. x402 Compatibility

Kite Chain is x402 compatible, enabling:
- Agent-to-agent (A2A) intents
- Verifiable message passing
- Autonomous micropayments

### 4. Agent-First Design

Purpose-built for:
- Autonomous agent operations
- AI model deployment
- Data marketplace
- Agent collaboration

## Tools & Resources

### Block Explorer

- **Testnet**: [https://testnet.kitescan.ai/](https://testnet.kitescan.ai/)

### Faucet

- **Testnet**: [https://faucet.gokite.ai](https://faucet.gokite.ai)

### Wallet

- Multi-sig wallet: [https://wallet.ash.center/?network=kite](https://wallet.ash.center/?network=kite)

### GitHub

- **Repository**: [https://github.com/gokite-ai/](https://github.com/gokite-ai/)

### Documentation

- **Full Docs**: [https://docs.gokite.ai/](https://docs.gokite.ai/)
- **Network Info**: [https://docs.gokite.ai/kite-chain/1-getting-started/network-information](https://docs.gokite.ai/kite-chain/1-getting-started/network-information)
- **Tools**: [https://docs.gokite.ai/kite-chain/1-getting-started/tools](https://docs.gokite.ai/kite-chain/1-getting-started/tools)
- **FAQs**: [https://docs.gokite.ai/kite-chain/1-getting-started/faqs](https://docs.gokite.ai/kite-chain/1-getting-started/faqs)

## Development

### Smart Contract Development

Kite Chain supports EVM-compatible smart contracts. See:
- [Smart Contract Basics](https://docs.gokite.ai/kite-chain/2-fundamentals/smart-contract-basics)
- [Developing Smart Contracts](https://docs.gokite.ai/kite-chain/3-developing/)

### dApp Development

Build dApps on Kite Chain:
- [Building dApps](https://docs.gokite.ai/kite-chain/4-building-dapps/)
- [Advanced Features](https://docs.gokite.ai/kite-chain/5-advanced/)

## Use Cases in AgentHub

1. **PoAI Verification**: Submit AI decisions to Kite Chain for immutable verification
2. **Agent Identity**: Register agents with cryptographic identity
3. **Cross-Agent Collaboration**: Enable A2A communication via x402
4. **Payment Authority**: Verifiable delegation for autonomous payments

## Benefits

- **Verifiable Attribution**: On-chain proof of which AI made which decision
- **Agent Identity**: Cryptographic identity for trust and reputation
- **x402 Native**: Built-in support for agent-to-agent payments
- **High Performance**: Fast, scalable infrastructure for AI workloads
- **Open Marketplace**: Discover and monetize AI agents and datasets

## Next Steps

1. Get testnet tokens from [faucet](https://faucet.gokite.ai)
2. Configure Kite Chain in `.env.local`
3. Deploy PoAI contract to Kite Chain testnet
4. Start submitting PoAI proofs for agent decisions
5. Explore [Kite Chain documentation](https://docs.gokite.ai/) for advanced features

**Ready to build the future of agentic commerce?** Start with [Kite Chain Introduction](https://docs.gokite.ai/).

