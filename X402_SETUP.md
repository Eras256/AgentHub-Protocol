# x402 Payment Protocol Setup

**HTTP 402 payment integration with Thirdweb on Avalanche Fuji**

Based on [x402-starter-kit](https://github.com/federiconardelli7/x402-starter-kit)

## What is x402?

x402 is an HTTP payment protocol that enables **autonomous micropayments** for AI agents and services. It uses HTTP status code 402 (Payment Required) to request payment before serving content.

## Features

- ✅ **HTTP 402 Protocol**: Standard payment request via HTTP headers
- ✅ **Two Payment Tiers**: Basic ($0.01 USDC) and Premium ($0.15 USDC)
- ✅ **Thirdweb Integration**: Uses ERC4337 Smart Account as facilitator
- ✅ **On-chain Verification**: Verifies payments on Avalanche Fuji
- ✅ **Autonomous Payments**: AI agents can pay without human intervention

## Setup

### 1. Thirdweb Configuration

#### Create Thirdweb Account

1. Go to [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. **Log in with your wallet** (connect your wallet to the dashboard)
3. Create a new project or use an existing one
4. Get your **Client ID** and **Secret Key** from the project

#### Set Up Facilitator Wallet (ERC4337 Smart Account)

**IMPORTANT:** The `THIRDWEB_SERVER_WALLET_ADDRESS` is the **facilitator address** used for transaction processing.

**You MUST use an ERC4337 Smart Account:**

1. In the Thirdweb dashboard, go to **Server Wallets** section
2. Click the switch button **Show ERC4337 Smart Account**
3. Switch to the network (Avalanche Fuji Testnet)
4. Copy the smart account address - this will be your `THIRDWEB_SERVER_WALLET_ADDRESS`
5. Send some testnet tokens to that address that will pay the gas fee

**IMPORTANT:** Do NOT use ERC-7702 accounts. Only ERC4337 Smart Accounts are supported as facilitators for some networks.

### 2. Environment Variables

Add to `.env.local`:

```bash
# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
THIRDWEB_SERVER_WALLET_ADDRESS=your_erc4337_smart_account_address

# Merchant Configuration
MERCHANT_WALLET_ADDRESS=your_payment_recipient_wallet_address

# USDC Contract (Avalanche Fuji Testnet)
USDC_CONTRACT_ADDRESS=0x5425890298aed601595a70AB815c96711a31Bc65
```

### 3. Get Testnet Tokens

1. **AVAX for gas**: Get from [Avalanche Faucet](https://faucet.avax.network/)
2. **USDC for payments**: Get from [Circle Faucet](https://faucet.circle.com/) or swap AVAX for USDC on Trader Joe

## Usage

### Client-Side Payment

```typescript
import { initiateX402Payment } from "@/lib/x402/client";
import { useX402Payment } from "@/lib/x402/hooks";

// Using hook
const { pay, isReady } = useX402Payment();

const handlePay = async () => {
  const result = await pay({
    amount: "0.01",
    token: "USDC",
    chain: "avalanche-fuji",
    recipient: "merchant-address",
    tier: "basic", // or "premium"
  });

  if (result.success) {
    console.log("Payment successful:", result.txHash);
  }
};

// Direct function call
const result = await initiateX402Payment({
  amount: "0.15",
  token: "USDC",
  chain: "avalanche-fuji",
  recipient: "merchant-address",
  tier: "premium",
});
```

### Server-Side Verification

```typescript
import { verifyX402Payment, createX402Middleware } from "@/lib/x402/middleware";

// In API route
export async function GET(req: NextRequest) {
  const paymentResult = await verifyX402Payment(req);

  if (!paymentResult.paid) {
    return NextResponse.json(
      { error: "Payment required" },
      {
        status: 402,
        headers: {
          "X-Accept-Payment": "USDC",
          "X-Payment-Amount": "0.01",
          "X-Payment-Chain": "avalanche-fuji",
        },
      }
    );
  }

  // Payment verified - serve content
  return NextResponse.json({ data: "premium content" });
}

// Using middleware
const x402Middleware = createX402Middleware({
  price: "0.15",
  token: "USDC",
  chain: "avalanche-fuji",
  tier: "premium",
});

export async function GET(req: NextRequest) {
  const middlewareResult = await x402Middleware(req);
  if (middlewareResult) {
    return middlewareResult; // Returns 402 if not paid
  }

  // Payment verified - continue
  return NextResponse.json({ data: "premium content" });
}
```

## Payment Tiers

- **Basic**: $0.01 USDC - For basic API access
- **Premium**: $0.15 USDC - For premium data and features

## API Routes

### POST `/api/x402/pay`

Initiates payment via Thirdweb facilitator.

**Request:**
```json
{
  "amount": "0.01",
  "token": "USDC",
  "chain": "avalanche-fuji",
  "recipient": "merchant-address",
  "tier": "basic"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "0.01",
  "token": "USDC",
  "chain": "avalanche-fuji",
  "recipient": "merchant-address",
  "facilitator": "facilitator-address"
}
```

### POST `/api/x402/verify`

Verifies payment transaction on-chain.

**Request:**
```json
{
  "txHash": "0x...",
  "chain": "avalanche-fuji"
}
```

**Response:**
```json
{
  "verified": true,
  "confirmed": true,
  "blockNumber": 12345,
  "status": 1,
  "to": "merchant-address",
  "from": "facilitator-address"
}
```

## Protected Endpoints

### GET `/api/protected/premium-data`

Example protected endpoint requiring premium payment ($0.15 USDC).

**Without payment:**
```json
{
  "error": "Payment required",
  "message": "This endpoint requires premium payment",
  "payment": {
    "tier": "premium",
    "amount": "0.15",
    "token": "USDC",
    "chain": "avalanche-fuji"
  }
}
```
Status: `402 Payment Required`

**With payment headers:**
```json
{
  "timestamp": 1234567890,
  "data": {
    "avaxPrice": 38.45,
    "btcPrice": 67890.12,
    "ethPrice": 3456.78,
    "volume24h": 1234567890,
    "marketCap": 98765432100,
    "prediction": {
      "next1h": "+2.3%",
      "next24h": "+5.7%",
      "confidence": 0.87
    }
  },
  "source": "AgentHub Premium Oracle",
  "paymentId": "0x..."
}
```

## How It Works

1. **Client requests protected endpoint** → Server returns `402 Payment Required`
2. **Client initiates payment** → Calls `/api/x402/pay` with payment details
3. **Server processes payment** → Uses Thirdweb facilitator (ERC4337 Smart Account) to transfer USDC
4. **Transaction confirmed** → Payment transaction hash returned to client
5. **Client retries request** → Includes payment headers (`x-payment-verified`, `x-payment-tx`)
6. **Server verifies payment** → Checks on-chain transaction status
7. **Content served** → If verified, server returns protected content

## Technical Stack

- **Next.js 14**: App Router with API routes
- **Thirdweb SDK v4**: Wallet integration and facilitator
- **ERC4337 Smart Accounts**: Autonomous payment execution
- **Avalanche Fuji**: Testnet blockchain
- **USDC**: Payment token

## Troubleshooting

### "THIRDWEB_SERVER_WALLET_ADDRESS not configured"

Make sure you've set up the ERC4337 Smart Account in Thirdweb Dashboard and copied the address to `.env.local`.

### "Payment failed"

- Check that facilitator address has testnet tokens for gas
- Verify USDC contract address is correct for Fuji testnet
- Ensure merchant address is valid

### "Transaction verification failed"

- Transaction may still be pending (wait a few seconds)
- Check transaction on [Snowtrace](https://testnet.snowtrace.io/)
- Verify transaction is to merchant address

## Resources

- **x402-starter-kit**: [https://github.com/federiconardelli7/x402-starter-kit](https://github.com/federiconardelli7/x402-starter-kit)
- **Thirdweb Dashboard**: [https://thirdweb.com/dashboard](https://thirdweb.com/dashboard)
- **Avalanche Fuji Explorer**: [https://testnet.snowtrace.io/](https://testnet.snowtrace.io/)
- **ERC4337 Documentation**: [https://eips.ethereum.org/EIPS/eip-4337](https://eips.ethereum.org/EIPS/eip-4337)

