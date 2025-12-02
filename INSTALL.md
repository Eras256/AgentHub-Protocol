# Instrucciones de Instalación - AgentHub Protocol

## Requisitos Previos

- Node.js 18 o superior
- pnpm (instalar con `npm install -g pnpm`)
- Cuenta de Thirdweb (gratuita)
- Wallet con AVAX en Fuji testnet (para deployment)

## Pasos de Instalación

### 1. Instalar Dependencias

```bash
pnpm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `env.example` a `.env.local`:

```bash
cp env.example .env.local
```

Edita `.env.local` y completa las siguientes variables:

#### Obligatorias:
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`: Obtén tu Client ID desde [Thirdweb Dashboard](https://thirdweb.com/dashboard)
- `AVALANCHE_FUJI_RPC`: URL del RPC de Avalanche Fuji (puedes usar el público o uno de Infura/Alchemy)
- `DEPLOYER_PRIVATE_KEY`: Tu clave privada del wallet para deployment (¡NUNCA compartas esto!)

#### Opcionales (para funcionalidad completa):
- `GOOGLE_GEMINI_API_KEY`: Para el chatbot AI (obtén tu API key en [Google AI Studio](https://makersuite.google.com/app/apikey))
- `SNOWTRACE_API_KEY`: Para verificar contratos en Snowtrace
- `PINATA_API_KEY`, `PINATA_SECRET_KEY`, `PINATA_JWT`: Para almacenar metadata en IPFS
- `KITE_RPC_URL`: RPC de Kite Chain (default: https://rpc-testnet.gokite.ai/)
- `KITE_API_KEY`: Para integración con Kite Chain (opcional)
- `KITE_AGENT_ADDRESS`: Dirección del wallet del agente en Kite Chain
- `KITE_POAI_CONTRACT_ADDRESS`: Dirección del contrato PoAI en Kite Chain

#### x402 Payment Protocol (Requerido para pagos autónomos):
- `THIRDWEB_SECRET_KEY`: Tu secret key de Thirdweb (del dashboard)
- `THIRDWEB_SERVER_WALLET_ADDRESS`: Dirección del ERC4337 Smart Account facilitator (del dashboard de Thirdweb)
- `MERCHANT_WALLET_ADDRESS`: Dirección del wallet que recibirá los pagos
- `USDC_CONTRACT_ADDRESS`: Dirección del contrato USDC en Fuji (opcional, default: 0x5425890298aed601595a70AB815c96711a31Bc65)

**Importante para x402:**
1. Ve al Thirdweb Dashboard → Server Wallets
2. Activa "Show ERC4337 Smart Account"
3. Cambia a Avalanche Fuji Testnet
4. Copia la dirección del smart account → `THIRDWEB_SERVER_WALLET_ADDRESS`
5. Envía tokens de testnet a esa dirección para pagar gas

**Kite Chain Testnet:**
- Chain ID: 2368
- RPC: https://rpc-testnet.gokite.ai/
- Explorer: https://testnet.kitescan.ai/
- Faucet: https://faucet.gokite.ai
- Docs: https://docs.gokite.ai/

**Referencia x402:** [x402-starter-kit](https://github.com/federiconardelli7/x402-starter-kit)

### 3. Compilar Contratos

```bash
pnpm compile
```

Esto generará los archivos ABI en `artifacts/contracts/`.

### 4. Ejecutar Tests

```bash
pnpm test
```

Para ver cobertura de código:

```bash
pnpm test:coverage
```

### 5. Desplegar Contratos (Opcional)

**IMPORTANTE**: Solo despliega si tienes AVAX en Fuji testnet.

```bash
pnpm deploy:fuji
```

Después del deployment, actualiza `.env.local` con las direcciones de los contratos desplegados:
- `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS`
- `NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS`

### 6. Iniciar Servidor de Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Solución de Problemas

### Error: "Cannot find module '@thirdweb-dev/react'"
Ejecuta `pnpm install` nuevamente.

### Error: "Invalid RPC URL"
Verifica que `AVALANCHE_FUJI_RPC` esté correctamente configurado en `.env.local`.

### Error al compilar contratos
Asegúrate de tener Hardhat instalado correctamente:
```bash
pnpm add -D hardhat @nomicfoundation/hardhat-toolbox
```

### Error: "Missing environment variable"
Verifica que todas las variables requeridas estén en `.env.local` (no `.env`).

## Estructura del Proyecto

```
AgentHubProtocol/
├── contracts/          # Smart contracts Solidity
├── scripts/            # Scripts de deployment
├── test/               # Tests de contratos
├── app/                # Next.js App Router
│   ├── api/           # API routes
│   ├── dashboard/     # Página de dashboard
│   ├── marketplace/   # Página de marketplace
│   └── create-agent/  # Página de creación de agentes
├── components/         # Componentes React
│   ├── effects/       # Efectos visuales (glassmorphism, neural)
│   ├── layout/       # Componentes de layout
│   └── ui/           # Componentes UI reutilizables
└── lib/               # Utilidades y hooks
    ├── contracts/    # Interacciones con contratos
    ├── hooks/        # React hooks personalizados
    └── utils/         # Funciones utilitarias
```

## Próximos Pasos

1. Conecta tu wallet usando el botón "Connect Wallet"
2. Explora el marketplace de servicios
3. Crea tu primer agente desde `/create-agent`
4. Visualiza tu dashboard en `/dashboard`

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Thirdweb](https://portal.thirdweb.com/)
- [Documentación de Hardhat](https://hardhat.org/docs)
- [Avalanche Fuji Faucet](https://faucet.avax.network/)

