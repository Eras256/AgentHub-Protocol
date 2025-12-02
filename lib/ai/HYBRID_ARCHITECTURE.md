# Hybrid AI Architecture: Gemini + Kite AI

AgentHub Protocol utiliza una arquitectura híbrida que combina lo mejor de ambos mundos:

## 🎯 Estrategia Híbrida

### Gemini (Principal) - Off-chain
- ✅ **Rápido**: 450ms promedio de respuesta
- ✅ **Económico**: $0.00015 vs $0.02/1K tokens (133x más barato)
- ✅ **Multimodal**: Visión, audio, video
- ✅ **Contexto masivo**: 1M tokens
- ✅ **Ideal para**: Chatbot, análisis, decisiones en tiempo real

### Kite Chain (Complemento) - On-chain
- ✅ **Verificable**: Proof of Attributed Intelligence (PoAI)
- ✅ **On-chain**: Atribución verificable en Kite Chain (Chain ID 2368)
- ✅ **Trazabilidad**: Rastreo de qué IA tomó qué decisión
- ✅ **Colaboración**: Cross-agent collaboration (A2A intents)
- ✅ **x402 Native**: Built-in x402 compatibility
- ✅ **Ideal para**: Verificación, atribución, memoria descentralizada
- **Reference**: [Kite Chain Docs](https://docs.gokite.ai/)

## 📐 Arquitectura en Capas

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
│  └─ Identity: Kite Chain 3-tier identity      │
│  └─ PoAI: Kite Chain (Chain ID 2368)          │
└────────────────────────────────────────────────┘
```

## 🔄 Flujo de Trabajo Híbrido

### 1. Decisión Off-chain (Gemini)

```typescript
// Análisis rápido y económico con Gemini
const decision = await gemini.generateContent(prompt);
```

**Ventajas:**
- Latencia sub-segundo
- Costo mínimo ($0.00015 por decisión)
- Contexto completo (1M tokens)
- Multimodal (texto + imágenes)

### 2. Verificación On-chain (Kite AI)

```typescript
// Generar PoAI y registrar on-chain
const proof = generatePoAI(decision);
const { txHash } = await submitPoAI(proof);
```

**Ventajas:**
- Verificación inmutable
- Atribución clara de decisión
- Trazabilidad completa
- Colaboración cross-agent

### 3. Ejecución (x402)

```typescript
// Ejecutar decisión vía x402 micropayment
await executeX402Trade(decision);
```

## 💻 Implementación

### HybridAIAgent

Clase base para agentes híbridos:

```typescript
import { HybridAIAgent } from "@/lib/ai/hybrid-agent";

const agent = new HybridAIAgent("agent-001", true);

// Decisión completa con verificación
const result = await agent.makeDecisionAndRecord(context);

// result.decision - Decisión de Gemini
// result.poaiProof - Prueba PoAI
// result.txHash - Transacción on-chain
```

### DeFiAgent

Agente DeFi especializado:

```typescript
import { DeFiAgent } from "@/lib/agents/hybrid-defi-agent";

const defiAgent = new DeFiAgent();

// Workflow completo
const result = await defiAgent.optimizeAndRecord(portfolio);

// result.analysis - Análisis Gemini
// result.proof - PoAI proof
// result.executionResult - Resultado x402
```

## 📊 Casos de Uso

### 1. Optimización DeFi

**Flujo:**
1. Gemini analiza portafolio (off-chain, rápido)
2. Kite AI registra decisión (on-chain, verificable)
3. x402 ejecuta trade (micropayment autónomo)

**Resultado:**
- Análisis en 450ms
- Verificación on-chain
- Ejecución autónoma

### 2. Trading Autónomo

**Flujo:**
1. Gemini genera señal de trading
2. Kite AI crea PoAI proof
3. Ejecución vía x402

**Resultado:**
- Decisiones verificables
- Trazabilidad completa
- Atribución clara

### 3. Auditoría de Contratos

**Flujo:**
1. Gemini analiza código (1M token context)
2. Kite AI registra hallazgos
3. Reporte con proof on-chain

**Resultado:**
- Análisis completo
- Hallazgos verificables
- Trazabilidad de auditoría

## 🔐 Proof of Attributed Intelligence (PoAI)

PoAI crea pruebas verificables de que una IA tomó una decisión específica:

```typescript
const proof = generatePoAI({
  agentId: "agent-001",
  decision: "Swap 30% AVAX to USDC",
  reasoning: "Price target reached",
  timestamp: Date.now(),
  model: "gemini-pro",
  confidence: 87,
  inputs: { price: 45.2, target: 45.0 }
});
```

**Características:**
- Hash determinístico
- Timestamp inmutable
- Modelo y confianza incluidos
- Inputs verificables

## 📈 Métricas de Performance

### Gemini (Off-chain)
- **Latencia**: 450ms promedio
- **Costo**: $0.00015 por decisión
- **Throughput**: 15 req/min (free tier)
- **Contexto**: 1M tokens

### Kite AI (On-chain)
- **Latencia**: ~2s (Avalanche finality)
- **Costo**: Gas fees (~$0.01-0.05)
- **Verificación**: Inmutable
- **Trazabilidad**: Completa

### Híbrido (Mejor de ambos)
- **Decisión**: 450ms (Gemini)
- **Verificación**: +2s (Kite AI)
- **Total**: ~2.5s end-to-end
- **Costo total**: ~$0.01-0.05 por decisión verificada

## 🎯 Cuándo Usar Cada Sistema

### Usa Solo Gemini cuando:
- ✅ Chatbot de usuario
- ✅ Análisis exploratorio
- ✅ Decisiones no críticas
- ✅ Prototipado rápido

### Usa Solo Kite AI cuando:
- ✅ Verificación on-chain requerida
- ✅ Colaboración cross-agent
- ✅ Memoria descentralizada
- ✅ Atribución crítica

### Usa Sistema Híbrido cuando:
- ✅ Decisiones críticas con verificación
- ✅ Trading autónomo
- ✅ Optimización DeFi
- ✅ Auditorías verificables

## 🚀 Próximos Pasos

1. **Integrar Kite AI SDK** (Q2 2025)
2. **Optimizar gas costs** para PoAI
3. **Cross-agent collaboration** en subnet
4. **Decentralized AI memory** persistente

## 📚 Referencias

- `lib/ai/hybrid-agent.ts` - Clase base híbrida
- `lib/agents/hybrid-defi-agent.ts` - Ejemplo DeFi
- `lib/kite/agent.ts` - Funciones PoAI
- `GEMINI_SETUP.md` - Configuración completa

