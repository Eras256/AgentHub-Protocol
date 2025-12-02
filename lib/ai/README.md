# AI Integration - Google Gemini

Google Gemini está integrado en AgentHub Protocol y puede usarse en múltiples áreas:

## Uso Actual

### 1. Chatbot de Asistencia (`app/api/chat/route.ts`)
- **Propósito**: Asistente de usuario para responder preguntas sobre AgentHub
- **Modelo**: `gemini-pro`
- **Contexto**: Conversación con historial

### 2. Decisiones de Agentes Autónomos (`lib/kite/agent.ts`)
- **Propósito**: Los agentes AI pueden usar Gemini para tomar decisiones autónomas
- **Uso**: Reemplazo o complemento de Kite AI
- **Contexto**: Estado del agente, datos de mercado, acciones disponibles

## Funcionalidades Disponibles

### `lib/ai/gemini.ts` - Utilidad Compartida

#### `generateGeminiResponse()`
Genera respuestas de Gemini con contexto personalizado.

```typescript
const response = await generateGeminiResponse(
  "¿Cuál es el mejor protocolo DeFi ahora?",
  "Eres un experto en DeFi en Avalanche",
  history // opcional
);
```

#### `makeAgentDecision()`
Permite que agentes autónomos tomen decisiones usando IA.

```typescript
const decision = await makeAgentDecision({
  agentId: "agent-001",
  agentType: "defi-optimizer",
  currentState: { balance: 1000, positions: [...] },
  availableActions: ["deposit", "withdraw", "swap", "wait"]
}, marketData);
```

#### `optimizeDeFiStrategy()`
Optimiza estrategias DeFi usando IA.

```typescript
const strategy = await optimizeDeFiStrategy(
  { avax: 1000, usdc: 500 },
  ["Trader Joe", "Benqi", "Aave"]
);
```

#### `auditSmartContract()`
Audita contratos inteligentes usando el contexto de 1M tokens de Gemini.

```typescript
const audit = await auditSmartContract(contractCode, "AgentRegistry");
// Returns: vulnerabilities, securityScore, recommendations
```

#### `generateTradingSignal()`
Genera señales de trading con análisis técnico.

```typescript
const signal = await generateTradingSignal("AVAX/USDC", {
  price: 45.2,
  volume: 1000000,
  rsi: 65,
  macd: 0.5
});
// Returns: signal (buy/sell/hold), confidence, entryPrice, stopLoss, takeProfit
```

## Funcionalidades Avanzadas

### UI Automation (`lib/agents/ui-automator.ts`)

Automatización de UI usando Gemini Computer Use para interactuar con DEXs:

```typescript
import { createDEXAutomator } from "@/lib/agents/ui-automator";

const automator = createDEXAutomator(
  "Monitor Trader Joe, swap AVAX→USDC when price > $45"
);

// Analizar y decidir siguiente acción
const { action, reasoning } = await automator.analyzeAndDecide();

// Monitorear y ejecutar cuando se cumplan condiciones
const result = await automator.monitorAndExecute({
  dex: "Trader Joe",
  pair: "AVAX/USDC",
  trigger: "price > $45",
  action: "swap AVAX→USDC"
});
```

### Multi-Agent Collaboration (`lib/agents/multi-agent.ts`)

Sistema de colaboración multi-agente con 3 agentes especializados:

```typescript
import { MultiAgentCollaboration } from "@/lib/agents/multi-agent";

const collaboration = MultiAgentCollaboration.createDefault();

// Colaboración completa
const result = await collaboration.collaborate({
  objective: "Optimize DeFi portfolio",
  marketData: { avaxPrice: 45.2 },
  portfolio: { benqi: 1000, traderJoe: 500 }
});

// Colaboración rápida
const quickResult = await collaboration.quickCollaborate(
  "Analyze AVAX market",
  "Review: Market shows bullish trend",
  "Execute if safe: Proceed with 30% allocation"
);
```

**Agentes disponibles:**
- **Market Analyst**: Análisis de mercado y tendencias
- **Risk Manager**: Evaluación de riesgos y salvaguardas
- **Executor**: Planes de ejecución optimizados

### AI Insights Dashboard (`components/dashboard/AIInsights.tsx`)

Componente de dashboard que muestra insights inteligentes de Gemini:

```tsx
import AIInsights from "@/components/dashboard/AIInsights";

<AIInsights
  portfolio={{
    benqi: { balance: 1000, apy: 8.5 },
    traderJoe: { balance: 500, apy: 11.2 }
  }}
  protocols={["Trader Joe", "Benqi", "Aave"]}
  onExecute={(insight) => {
    // Ejecutar vía x402 payment
    executeX402Payment(insight.action);
  }}
/>
```

**Características:**
- Sugerencias automáticas de optimización DeFi
- Análisis de riesgo en tiempo real
- Botones de ejecución directa vía x402
- Confianza y razonamiento para cada insight

## Arquitectura Híbrida: Gemini + Kite AI

### Hybrid AI Agent (`lib/ai/hybrid-agent.ts`)

Sistema híbrido que combina lo mejor de ambos mundos:

- **Gemini**: Decisiones rápidas y económicas (off-chain)
- **Kite AI**: Verificación on-chain y atribución (PoAI)

```typescript
import { HybridAIAgent } from "@/lib/ai/hybrid-agent";

// Crear agente híbrido
const agent = new HybridAIAgent("agent-001", true); // true = usar Kite AI

// Decisión completa: Gemini (off-chain) + Kite AI (on-chain)
const result = await agent.makeDecisionAndRecord({
  portfolio: { benqi: 1000, traderJoe: 500 },
  marketData: { avaxPrice: 45.2 }
});

// result.decision - Decisión de Gemini (rápida, barata)
// result.poaiProof - Prueba PoAI de Kite AI (verificable)
// result.txHash - Hash de transacción on-chain
```

### DeFi Hybrid Agent (`lib/agents/hybrid-defi-agent.ts`)

Agente DeFi especializado con arquitectura híbrida:

```typescript
import { DeFiAgent } from "@/lib/agents/hybrid-defi-agent";

const defiAgent = new DeFiAgent("defi-001");

// Workflow completo: Analizar → Registrar → Ejecutar
const result = await defiAgent.optimizeAndRecord({
  balances: { AVAX: 1000, USDC: 500 },
  positions: [
    { protocol: "Benqi", token: "AVAX", amount: 500, apy: 8.5 }
  ],
  totalValue: 1500
});

// result.analysis - Análisis de Gemini
// result.proof - Prueba PoAI de Kite AI
// result.txHash - Transacción on-chain
// result.executionResult - Resultado de ejecución x402
```

### Proof of Attributed Intelligence (PoAI)

Sistema de verificación on-chain para decisiones de IA:

```typescript
import { generatePoAI, submitPoAI } from "@/lib/kite/agent";

// Generar prueba PoAI
const proof = generatePoAI({
  agentId: "agent-001",
  decision: "Swap 30% AVAX to USDC",
  reasoning: "Price target reached",
  timestamp: Date.now(),
  model: "gemini-pro",
  confidence: 87,
  inputs: { price: 45.2, target: 45.0 }
});

// Enviar a Kite AI para verificación on-chain
const { txHash } = await submitPoAI(proof);
```

### Cuándo Usar Cada Sistema

**Usa Gemini para:**
- Chatbot de usuario (rápido, barato)
- Análisis de portafolio
- Auditorías de contratos
- Decisiones en tiempo real

**Usa Kite AI para:**
- Atribución on-chain (PoAI)
- Verificación de decisiones
- Colaboración cross-agent
- Memoria descentralizada de agentes

**Usa Sistema Híbrido para:**
- Decisiones críticas que requieren verificación
- Agentes DeFi con trazabilidad
- Optimización de portafolios con proof
- Trading autónomo con atribución

## Casos de Uso Potenciales

### 1. Agentes DeFi Autónomos
- Análisis de mercado en tiempo real
- Optimización de yield farming
- Rebalancing automático de portafolios
- Gestión de riesgo

### 2. Agentes de Trading
- Análisis técnico
- Señales de compra/venta
- Gestión de stop-loss
- Arbitraje

### 3. Agentes de Datos
- Análisis de sentimiento
- Predicciones de precios
- Análisis de tendencias
- Generación de reportes

### 4. Agentes IoT
- Toma de decisiones basada en sensores
- Alertas inteligentes
- Optimización de recursos
- Mantenimiento predictivo

## Configuración

Agrega a `.env.local`:
```bash
GOOGLE_GEMINI_API_KEY=tu_api_key
```

## Rate Limits

- Free tier: 15 requests/minuto
- Paid tier: Límites más altos

El código incluye manejo de errores para gestionar rate limits gracefully.

