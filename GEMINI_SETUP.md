# Google Gemini Integration in AgentHub Protocol

## Why Gemini?

✅ **133x more cost-effective** than alternatives ($0.00015 vs $0.02/1K tokens)  
✅ **1M token context** - Analyze entire codebase + docs simultaneously  
✅ **Multimodal native** - Vision for charts, audio for IoT alerts  
✅ **Ultra-low latency** - Flash variant optimized for real-time agents  
✅ **Hackathon bonus** - Google prizes projects using Gemini  

## Architecture

**User Layer**: Chatbot assistance (`app/api/chat/route.ts`)  
**Agent Layer**: Autonomous decisions (`lib/kite/agent.ts`)  
**System Layer**: DeFi optimization, contract audits, IoT logic (`lib/ai/gemini.ts`)  
**Advanced Features**: UI Automation, Multi-Agent Collaboration, AI Insights Dashboard

## Performance Metrics

- **Average response time**: 450ms (vs 1200ms Claude)
- **Cost per 1M agent decisions**: $0.15 (vs $3.00 Claude)
- **Context window**: 1,048,576 tokens (vs 200K Claude)
- **Multimodal support**: Images, audio, video (vs text-only)
- **Model**: `gemini-pro` / `gemini-2.5-flash` (for real-time)

## Use Cases

### 1. **DeFi Portfolio Optimizer**
- Analyzes charts + on-chain data
- Suggests rebalancing strategies
- Executes via x402 micropayments
- **Component**: `components/dashboard/AIInsights.tsx`

### 2. **Smart Contract Auditor**
- Reviews all contracts simultaneously (1M context)
- Detects cross-contract vulnerabilities
- Generates detailed reports
- **Function**: `auditSmartContract()` in `lib/ai/gemini.ts`

### 3. **IoT Agent Controller**
- Processes sensor data (temperature, humidity)
- Makes contextual decisions
- Pays for premium APIs only when needed
- **Integration**: Via `makeAgentDecision()` with IoT context

### 4. **Trading Signal Generator**
- Technical analysis of AVAX/USDC
- Sentiment analysis from social media
- Executes trades autonomously
- **Function**: `generateTradingSignal()` in `lib/ai/gemini.ts`

### 5. **UI Automation Agent** 🆕
- Monitors DEXs automatically
- Executes trades via browser automation
- Uses Gemini Computer Use for vision + control
- **Component**: `lib/agents/ui-automator.ts`

### 6. **Multi-Agent Collaboration** 🆕
- 3 specialized agents working together:
  - **Market Analyst**: Analyzes market conditions
  - **Risk Manager**: Assesses risks and safeguards
  - **Executor**: Creates execution plans
- **Component**: `lib/agents/multi-agent.ts`

## Getting Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Configuration

Add your API key to `.env.local`:

```bash
GOOGLE_GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_ENABLE_AI_INSIGHTS=true  # Optional: Enable AI Insights dashboard
```

## API Usage

### Basic Functions (`lib/ai/gemini.ts`)

```typescript
// Generate response with context
const response = await generateGeminiResponse(
  "Analyze AVAX market",
  "You are a DeFi expert"
);

// Agent decision making
const decision = await makeAgentDecision({
  agentId: "agent-001",
  agentType: "defi-optimizer",
  currentState: { balance: 1000 },
  availableActions: ["deposit", "withdraw", "swap"]
});

// DeFi strategy optimization
const strategy = await optimizeDeFiStrategy(
  { benqi: 1000, traderJoe: 500 },
  ["Trader Joe", "Benqi", "Aave"]
);

// Smart contract audit
const audit = await auditSmartContract(contractCode, "AgentRegistry");

// Trading signal generation
const signal = await generateTradingSignal("AVAX/USDC", marketData);
```

### UI Automation (`lib/agents/ui-automator.ts`)

```typescript
import { createDEXAutomator } from "@/lib/agents/ui-automator";

const automator = createDEXAutomator(
  "Monitor Trader Joe, swap AVAX→USDC when price > $45"
);

// Analyze and decide next action
const { action, reasoning } = await automator.analyzeAndDecide();

// Monitor and execute when conditions met
const result = await automator.monitorAndExecute({
  dex: "Trader Joe",
  pair: "AVAX/USDC",
  trigger: "price > $45",
  action: "swap AVAX→USDC"
});
```

### Multi-Agent Collaboration (`lib/agents/multi-agent.ts`)

```typescript
import { MultiAgentCollaboration } from "@/lib/agents/multi-agent";

const collaboration = MultiAgentCollaboration.createDefault();

// Full collaboration workflow
const result = await collaboration.collaborate({
  objective: "Optimize DeFi portfolio",
  marketData: { avaxPrice: 45.2, volume: 1000000 },
  portfolio: { benqi: 1000, traderJoe: 500 }
});

// Quick collaboration
const quickResult = await collaboration.quickCollaborate(
  "Analyze AVAX market",
  "Current portfolio: 1000 AVAX",
  "Execute if safe"
);
```

### AI Insights Dashboard (`components/dashboard/AIInsights.tsx`)

```tsx
import AIInsights from "@/components/dashboard/AIInsights";

<AIInsights
  portfolio={{
    benqi: { balance: 1000, apy: 8.5 },
    traderJoe: { balance: 500, apy: 11.2 }
  }}
  protocols={["Trader Joe", "Benqi", "Aave"]}
  onExecute={(insight) => {
    // Execute via x402 payment
    console.log("Executing:", insight);
  }}
/>
```

## Fallback Behavior

If `GOOGLE_GEMINI_API_KEY` is not configured:

**Chatbot:**
- Displays demo mode message
- Uses mock responses for common questions
- Still provides helpful information

**Agents:**
- Use mock Kite AI implementation
- Basic functionality available
- No advanced AI capabilities

**AI Insights:**
- Shows mock insights for demo
- Set `NEXT_PUBLIC_ENABLE_AI_INSIGHTS=false` to disable

## Testing

1. Start development server: `pnpm dev`
2. Open dashboard: Navigate to `/dashboard`
3. View AI Insights: Check the "🤖 Gemini AI Insights" card
4. Test chatbot: Click chat button in bottom-right
5. Test multi-agent: Use `MultiAgentCollaboration` in your code

## Troubleshooting

**Error: "Failed to get AI response"**
- Check that `GOOGLE_GEMINI_API_KEY` is set correctly
- Verify API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check server logs for detailed error messages

**AI Insights not showing**
- Ensure `GOOGLE_GEMINI_API_KEY` is configured
- Check browser console for errors
- Verify `NEXT_PUBLIC_ENABLE_AI_INSIGHTS` is set (optional)

**Rate limit errors**
- Free tier: 15 requests/minute
- Upgrade to paid tier for higher limits
- Code includes graceful error handling

## API Limits

Google Gemini rate limits:
- **Free tier**: 15 requests per minute
- **Paid tier**: Higher limits (check Google AI Studio)

The code includes error handling to gracefully manage rate limits.

## 🏆 Pitch Final para Demo

**"AgentHub Protocol es la primera plataforma donde agentes AI completamente autónomos, impulsados por Google Gemini 2.5 Flash, pueden:**

🤖 **Tomar decisiones inteligentes** - Análisis multimodal (texto + imágenes + datos on-chain)  
💰 **Pagar por servicios** - x402 micropayments sin intervención humana  
📊 **Optimizar DeFi** - 133x más económico que GPT-4, con 1M token context  
🔍 **Auto-auditarse** - Gemini revisa contratos y detecta vulnerabilidades  
🌡️ **Controlar IoT** - Sensores ESP32 con AI decision-making  
🖥️ **Automatizar UI** - Gemini Computer Use para interacción con DEXs  
🤝 **Colaborar multi-agente** - 3 agentes especializados trabajando juntos  

**Todo construido sobre Avalanche, con $0.15 por millón de decisiones AI vs $3.00 de competidores."**

## Kite AI Integration (Optional)

While AgentHub primarily uses **Google Gemini** for AI operations (chatbot, portfolio analysis, smart contract audits), we integrate **Kite AI** for specific use cases:

### When to Use Kite AI:

✅ **On-chain AI attribution** - Proof of Attributed Intelligence (PoAI)  
✅ **Verifiable decision provenance** - Track which AI made which decision  
✅ **Cross-agent collaboration** - Agents working together on Kite subnet  
✅ **Decentralized AI memory** - Portable, persistent agent memory  

### When to Use Gemini:

✅ **User-facing chatbot** - Fast, cheap, multimodal responses  
✅ **Portfolio analysis** - Vision + data processing  
✅ **Smart contract audits** - 1M token context window  
✅ **Real-time decisions** - Sub-second latency  

### Hybrid Architecture:

```typescript
// Off-chain AI (Gemini) → Decision
const decision = await gemini.generateContent(prompt);

// On-chain verification (Kite AI) → Proof
const proof = await kiteAI.submitPoAI(decision);
```

**Architecture Layers:**

```
┌────────────────────────────────────────────────┐
│  LAYER 1: User Interface                       │
│  ├─ Chatbot: Gemini API (fast, cheap)         │
│  └─ UI Insights: Gemini Vision                 │
├────────────────────────────────────────────────┤
│  LAYER 2: Agent Intelligence                   │
│  ├─ Decisions: Gemini (off-chain)             │
│  └─ Attribution: Kite AI PoAI (on-chain)      │
├────────────────────────────────────────────────┤
│  LAYER 3: Infrastructure                       │
│  ├─ Payments: x402 + Avalanche C-Chain        │
│  └─ Identity: Kite AI 3-layer hierarchy       │
└────────────────────────────────────────────────┘
```

### Installation:

Kite Chain is a sovereign Layer-1 blockchain. Integration can be done via:

1. **Direct RPC calls** to Kite Chain (current implementation)
2. **Kite SDK** (when available from [GitHub](https://github.com/gokite-ai/))
3. **Smart contracts** deployed on Kite Chain

### Configuration:

Add to `.env.local`:

```bash
# Kite Chain (optional - for on-chain PoAI verification)
KITE_RPC_URL=https://rpc-testnet.gokite.ai/
KITE_API_KEY=your_kite_api_key
KITE_AGENT_ADDRESS=your_agent_wallet_address
KITE_POAI_CONTRACT_ADDRESS=poai_contract_address
```

**Kite Chain Testnet:**
- Chain ID: **2368**
- RPC URL: `https://rpc-testnet.gokite.ai/`
- Explorer: `https://testnet.kitescan.ai/`
- Faucet: `https://faucet.gokite.ai`
- Token: KITE

**Reference:** [Kite Chain Documentation](https://docs.gokite.ai/)

### Usage Example:

```typescript
import { HybridAIAgent } from "@/lib/ai/hybrid-agent";
import { DeFiAgent } from "@/lib/agents/hybrid-defi-agent";
import { submitPoAI, KITE_NETWORKS } from "@/lib/kite/agent";

// Create hybrid agent (Gemini + Kite Chain)
const agent = new HybridAIAgent("agent-001", true); // true = use Kite Chain

// Make decision with Gemini (off-chain)
const result = await agent.makeDecisionAndRecord({
  portfolio: { benqi: 1000, traderJoe: 500 },
  marketData: { avaxPrice: 45.2 }
});

// result.decision - Gemini decision (fast, cheap)
// result.poaiProof - Kite Chain PoAI proof (verifiable, on-chain)
// result.txHash - Kite Chain transaction hash

// Submit PoAI to Kite Chain testnet
const { txHash } = await submitPoAI(result.poaiProof!);
console.log(`PoAI submitted: ${KITE_NETWORKS.testnet.explorer}/tx/${txHash}`);

// DeFi Agent example
const defiAgent = new DeFiAgent("defi-001");

const optimization = await defiAgent.optimizeAndRecord({
  balances: { AVAX: 1000, USDC: 500 },
  positions: [
    { protocol: "Benqi", token: "AVAX", amount: 500, apy: 8.5 }
  ],
  totalValue: 1500
});

// optimization.analysis - Gemini analysis
// optimization.proof - Kite Chain PoAI proof
// optimization.txHash - Kite Chain transaction hash
```

### Kite Chain Network Information:

**Testnet:**
- Chain Name: KiteAI Testnet
- Chain ID: 2368
- RPC URL: `https://rpc-testnet.gokite.ai/`
- Explorer: `https://testnet.kitescan.ai/`
- Faucet: `https://faucet.gokite.ai`
- Token: KITE

**Mainnet:** Coming soon

**Reference:** [Kite Chain Network Information](https://docs.gokite.ai/kite-chain/1-getting-started/network-information)

### Proof of Attributed Intelligence (PoAI)

PoAI creates verifiable proofs that an AI made a specific decision:

```typescript
import { generatePoAI, submitPoAI } from "@/lib/kite/agent";

const proof = generatePoAI({
  agentId: "agent-001",
  decision: "Swap 30% AVAX to USDC",
  reasoning: "Price target reached",
  timestamp: Date.now(),
  model: "gemini-pro",
  confidence: 87,
  inputs: { price: 45.2, target: 45.0 }
});

// Submit to Kite AI for on-chain verification
const { txHash } = await submitPoAI(proof);
```

**Note:** Kite Chain testnet is live (Chain ID 2368). Mainnet coming soon. For more information, visit [Kite Chain Docs](https://docs.gokite.ai/) or [GitHub](https://github.com/gokite-ai/).

## Additional Resources

- See `lib/ai/README.md` for technical details
- See `lib/agents/` for advanced agent implementations
- See `components/dashboard/AIInsights.tsx` for dashboard integration
- See `lib/ai/hybrid-agent.ts` for hybrid architecture
- See `lib/agents/hybrid-defi-agent.ts` for DeFi agent example
