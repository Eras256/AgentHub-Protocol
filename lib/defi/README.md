# DeFi Protocol Integrations

Integraciones reales con protocolos DeFi en Avalanche: Trader Joe, Benqi y Aave.

## 📋 Características

### ✅ Trader Joe (DEX)
- **Swaps de tokens**: Intercambia tokens directamente en el DEX
- **Quotes en tiempo real**: Obtén cotizaciones antes de ejecutar
- **Soporte para AVAX nativo**: Maneja swaps con AVAX y tokens ERC20
- **Protección contra slippage**: Configuración de tolerancia de slippage

### ✅ Benqi (Lending)
- **Supply**: Deposita tokens para ganar intereses
- **Borrow**: Toma prestado contra tu colateral
- **Repay**: Paga préstamos
- **Withdraw**: Retira tus depósitos
- **Account Liquidity**: Consulta tu liquidez y posiciones

### ✅ Aave V3 (Lending)
- **Supply**: Deposita tokens (incluye soporte para AVAX nativo)
- **Borrow**: Toma prestado con tasa fija o variable
- **Repay**: Paga préstamos
- **Withdraw**: Retira depósitos
- **User Account Data**: Obtén datos completos de tu cuenta

## 🚀 Uso

### Trader Joe - Ejecutar Swap

```typescript
import { executeSwap, getSwapQuote } from "@/lib/defi/traderjoe";
import { ethers } from "ethers";

const signer = await wallet.getSigner();

// Obtener cotización
const quote = await getSwapQuote(
  provider,
  "0x...", // tokenIn address
  "0x...", // tokenOut address
  ethers.parseUnits("1", 18).toString(), // amount
  "avalanche-fuji"
);

// Ejecutar swap
const result = await executeSwap(signer, {
  tokenIn: "AVAX", // o dirección del token
  tokenOut: "USDC",
  amountIn: ethers.parseUnits("1", 18).toString(),
  slippageTolerance: 300, // 3%
}, "avalanche-fuji");

if (result.success) {
  console.log("Swap exitoso:", result.txHash);
}
```

### Benqi - Supply y Borrow

```typescript
import { supplyToBenqi, borrowFromBenqi } from "@/lib/defi/benqi";

// Supply AVAX
const supplyResult = await supplyToBenqi(
  signer,
  {
    asset: "AVAX",
    amount: ethers.parseEther("1").toString(),
  },
  comptrollerAddress,
  "avalanche-fuji"
);

// Borrow USDC
const borrowResult = await borrowFromBenqi(
  signer,
  {
    asset: "USDC",
    amount: ethers.parseUnits("100", 6).toString(),
  },
  comptrollerAddress,
  "avalanche-fuji"
);
```

### Aave - Supply y Borrow

```typescript
import { supplyToAave, borrowFromAave, INTEREST_RATE_MODE } from "@/lib/defi/aave";

// Supply AVAX
const supplyResult = await supplyToAave(
  signer,
  {
    asset: "AVAX",
    amount: ethers.parseEther("1").toString(),
  },
  poolAddressesProvider,
  "avalanche-fuji"
);

// Borrow con tasa variable
const borrowResult = await borrowFromAave(
  signer,
  {
    asset: "USDC",
    amount: ethers.parseUnits("100", 6).toString(),
    interestRateMode: INTEREST_RATE_MODE.VARIABLE,
  },
  poolAddressesProvider,
  "avalanche-fuji"
);
```

## 🔧 Configuración

Agrega estas variables a tu `.env.local`:

```env
# Trader Joe Router
TRADER_JOE_ROUTER_ADDRESS=0xd7f655E3376cE2d7A2b08fF01Eb3B1023191A901

# Benqi Comptroller
BENQI_COMPTROLLER_ADDRESS=your_benqi_comptroller_address

# Aave PoolAddressesProvider
AAVE_PROVIDER_ADDRESS=your_aave_provider_address
```

## 📝 Notas Importantes

1. **Direcciones de Testnet**: Las direcciones de contratos en Fuji testnet pueden necesitar ser verificadas desde la documentación oficial de cada protocolo.

2. **Aprobaciones de Tokens**: Los módulos manejan automáticamente las aprobaciones de tokens ERC20 cuando es necesario.

3. **AVAX Nativo**: Tanto Benqi como Aave requieren usar gateways especiales para operaciones con AVAX nativo. Los módulos manejan esto automáticamente.

4. **Slippage**: Trader Joe permite configurar tolerancia de slippage. El default es 3% (300 basis points).

5. **Tasas de Interés**: Aave soporta tasas fijas y variables. Usa `INTEREST_RATE_MODE.STABLE` o `INTEREST_RATE_MODE.VARIABLE`.

## 🔗 Referencias

- [Trader Joe Docs](https://docs.traderjoexyz.com/)
- [Benqi Docs](https://docs.benqi.fi/)
- [Aave Docs](https://docs.aave.com/)

## ⚠️ Advertencias

- **Siempre prueba en testnet primero**
- **Verifica las direcciones de contratos** antes de usar en mainnet
- **Revisa los límites de gas** para operaciones complejas
- **Maneja errores apropiadamente** - las operaciones pueden fallar por múltiples razones

