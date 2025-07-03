export const HATI_CONFIG = {
  MERCHANT_NETWORK: {
    chainId: 10, // 0xa
    name: 'Optimism',
    symbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    rpc: 'https://mainnet.optimism.io',
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Native USDC on Optimism
  },

  // Circle Wallet Configuration
  CIRCLE_WALLET: {
    blockchain: 'EVM', // Generic EVM support for Optimism
    accountType: 'EOA', // Externally Owned Account (receive-only)
    features: [
      'USDC receiving on Optimism',
      'Transaction signing',
      'Cross-chain address consistency',
    ],
  },

  BRIDGE_SOURCES: [
    { chainId: 1, name: 'Ethereum', symbol: 'ETH' },
    { chainId: 42161, name: 'Arbitrum', symbol: 'ETH' },
    { chainId: 8453, name: 'Base', symbol: 'ETH' },
    { chainId: 59144, name: 'Linea', symbol: 'ETH' },
    { chainId: 137, name: 'Polygon', symbol: 'MATIC' },
    { chainId: 56, name: 'BSC', symbol: 'BNB' },
  ],

  PAYMENT_FLOW: {
    description:
      'Users pay from any supported chain → LiFi bridges to Optimism → Merchants receive USDC on Optimism',
    userExperience: 'Pay with any token on any chain',
    merchantExperience: 'Receive USDC on Optimism, withdraw to Linea available',
    settlementTime: '8-20 seconds via CCTP',
  },

  METAMASK_CARD: {
    verificationNetwork: 'Optimism',
    benefits: {
      basic: ['Standard transaction processing'],
      premium: ['Reduced fees', 'Priority support'],
      elite: ['Zero fees', 'Advanced features', 'Exclusive partnerships'],
    },
  },
} as const

// Type exports for TypeScript safety
export type HatiMerchantNetwork = typeof HATI_CONFIG.MERCHANT_NETWORK
export type HatiBridgeSource = (typeof HATI_CONFIG.BRIDGE_SOURCES)[0]
export type HatiCardTier = 'basic' | 'premium' | 'elite'
