# @agenthub/sdk

Official TypeScript SDK for AgentHub Protocol - Build autonomous AI agents on Avalanche.

## Installation

```bash
npm install @agenthub/sdk
# or
pnpm add @agenthub/sdk
# or
yarn add @agenthub/sdk
```

## Quick Start

### SDK Usage

```typescript
import { AgentHubSDK } from '@agenthub/sdk';

// Initialize SDK
const sdk = new AgentHubSDK({
  network: 'avalanche-fuji',
  privateKey: process.env.PRIVATE_KEY,
});

// Register an agent
const tx = await sdk.agents.register({
  agentId: 'my-agent-001',
  metadataIPFS: 'ipfs://Qm...',
  stakeAmount: '0.01', // AVAX (minimum configurable, reduced from 1 AVAX)
});

// Publish a service
const serviceTx = await sdk.marketplace.publishService({
  name: 'My AI Service',
  description: 'Description of service',
  endpointURL: 'https://api.example.com',
  pricePerRequest: '0.01', // USDC
});

// Make x402 payment
const payment = await sdk.x402.pay({
  amount: '0.01',
  token: 'USDC',
  tier: 'premium',
});
```

### CLI Usage

```bash
# Register an agent
agenthub agent:register \
  --agent-id "my-agent-001" \
  --metadata "ipfs://Qm..." \
  --stake "0.01" \
  --network fuji

# Publish a service
agenthub marketplace:publish \
  --name "My AI Service" \
  --description "Service description" \
  --endpoint "https://api.example.com" \
  --price "0.01" \
  --network fuji

# Make x402 payment
agenthub x402:pay \
  --amount "0.01" \
  --token USDC \
  --tier premium
```

## Features

- ✅ Agent Registry operations (ERC-8004)
- ✅ Marketplace operations
- ✅ x402 Payment protocol
- ✅ Revenue distribution
- ✅ TypeScript-first API
- ✅ CLI tools included

## Testing

The SDK includes comprehensive end-to-end tests that verify all functionality with real blockchain interactions on Avalanche Fuji Testnet.

### Test Suite Overview

- **Total Tests**: 48 tests across 4 test suites
- **Test Coverage**: 54.08% statements, 78.26% branches
- **Test Environment**: Avalanche Fuji Testnet (Chain ID: 43113)
- **Test Framework**: Jest with ts-jest

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Suites

1. **SDK Tests** (`__tests__/sdk.test.ts`)
   - SDK initialization and configuration
   - Agent Registry operations
   - Marketplace operations
   - x402 Payment operations
   - AI operations
   - Error handling

2. **Integration Tests** (`__tests__/integration.test.ts`)
   - Real blockchain network connections
   - Wallet balance queries
   - Contract read operations
   - Service marketplace queries

3. **CLI Tests** (`__tests__/cli.test.ts`)
   - CLI help and version commands
   - Command structure validation
   - Error handling

4. **CLI End-to-End Tests** (`__tests__/cli.e2e.test.ts`)
   - Complete CLI workflow testing
   - Real blockchain transactions
   - Command execution with actual data
   - Environment variable integration

### Deployed Contract Addresses (Avalanche Fuji Testnet)

All tests use these deployed contract addresses:

| Contract | Address | Explorer Link | Min Stake |
|----------|---------|---------------|-----------|
| **AgentRegistry** | `0x7cc7cAaB11C6914897ecA7e70dcC90a7C973D223` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x7cc7cAaB11C6914897ecA7e70dcC90a7C973D223) | 0.01 AVAX |
| **ServiceMarketplace** | `0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4` | [View on Snowtrace](https://testnet.snowtrace.io/address/0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4) | - |
| **RevenueDistributor** | `0x0B987e64a7cB481Aad7500011503D5d0444b1707` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x0B987e64a7cB481Aad7500011503D5d0444b1707) | - |
| **USDC Token** | `0x5425890298aed601595a70AB815c96711a31Bc65` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x5425890298aed601595a70AB815c96711a31Bc65) | - |

### Test Configuration

Tests use minimum verifiable amounts to keep costs low:

- **Agent Registration**: 0.01 AVAX (configurable minimum stake - reduced from 1 AVAX for better accessibility and alignment with x402 micropayment philosophy)
- **Marketplace Services**: 0.000001 USDC (minimum verifiable)
- **x402 Payments**: 0.000001 USDC (minimum verifiable)
- **Additional Staking**: 0.000001 AVAX (minimum verifiable)

> **✅ Updated**: The `AgentRegistry` contract now uses a configurable minimum stake of **0.01 AVAX** (reduced from 1 AVAX), making it more accessible for testing and aligned with x402 micropayment philosophy. The owner can adjust this value using `setMinStake()` if needed.

### Generated Test Data

During E2E tests, the following data is generated:

#### Agent Registration Test Data
- **Agent IDs**: `e2e-test-{timestamp}-{random}`
- **Metadata IPFS**: `QmTest123456789`
- **Stake Amount**: `0.01 AVAX` (reduced from 1 AVAX for better testing accessibility)
- **Network**: `avalanche-fuji`

> **Note**: Agent registration tests require 1 AVAX + gas fees. If you don't have sufficient testnet AVAX, these tests will be skipped automatically. Get testnet AVAX from [Avalanche Faucet](https://faucet.avax.network/).

#### Marketplace Service Test Data
- **Service Names**: `E2E Test Service {timestamp}-{random}`
- **Descriptions**: Test service descriptions
- **Endpoints**: `https://api.example.com/service`
- **Prices**: `0.000001 USDC` (minimum verifiable)

#### Example Transaction Hashes

Real transactions executed during tests generate unique hashes. Example format:

```
✅ Agent registered successfully!
   Transaction: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   Block: 12345678
```

To view transactions on Snowtrace Explorer:
1. Run tests with `npm test`
2. Look for transaction hashes in test output
3. Visit: `https://testnet.snowtrace.io/tx/{TRANSACTION_HASH}`

**Example Transaction Types:**
- **Agent Registration**: Creates new agent with 1 AVAX stake
- **Service Publication**: Publishes service to marketplace
- **x402 Payment**: Processes payment via x402 protocol

> **Note**: Transaction hashes are generated dynamically during test execution. Each test run creates new transactions with unique hashes. Check test console output for actual transaction hashes and block numbers.

### Test Environment Setup

To run tests with real blockchain interactions, configure your `.env.local`:

```env
# Required for real blockchain tests
PRIVATE_KEY=your_private_key_here

# Optional: Contract addresses (uses defaults if not set)
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x7cc7cAaB11C6914897ecA7e70dcC90a7C973D223
NEXT_PUBLIC_SERVICE_MARKETPLACE_ADDRESS=0xe51BF692F7ce26999f8D18d799f73Ad250BfeEC4
NEXT_PUBLIC_REVENUE_DISTRIBUTOR_ADDRESS=0x0B987e64a7cB481Aad7500011503D5d0444b1707

# Optional: RPC URL (uses default if not set)
NEXT_PUBLIC_AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
```

### Test Results

All tests pass successfully:

```
✅ Test Suites: 4 passed, 4 total
✅ Tests: 48 passed, 48 total
✅ Snapshots: 0 total
✅ Time: ~34-38 seconds
```

### Test Coverage

Current test coverage metrics:

```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
All files          |  54.08  |  78.26   |  37.5   |  54.08
 src               |  56.52  |  63.63   |  39.28  |  56.52
 src/contracts     |  51.92  |  91.66   |  33.33  |  51.92
```

### Continuous Integration

Tests are designed to:
- ✅ Run in CI/CD pipelines
- ✅ Work with or without private keys (skip blockchain tests if not configured)
- ✅ Use minimal amounts for real blockchain interactions
- ✅ Provide clear error messages for missing configuration

## Documentation

Full documentation available at: [docs.agenthub.io](https://docs.agenthub.io)

## License

MIT

