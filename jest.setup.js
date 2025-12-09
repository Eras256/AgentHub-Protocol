// Jest setup file
// This file runs before each test file

// Mock Next.js environment
process.env.NODE_ENV = 'test'

// Mock environment variables if needed
if (!process.env.THIRDWEB_SECRET_KEY) {
  process.env.THIRDWEB_SECRET_KEY = 'test-secret-key'
}

if (!process.env.THIRDWEB_SERVER_WALLET_ADDRESS) {
  process.env.THIRDWEB_SERVER_WALLET_ADDRESS = '0x0000000000000000000000000000000000000000'
}

if (!process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS) {
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS = '0x6750Ed798186b4B5a7441D0f46Dd36F372441306'
}

