/**
 * Hati Network Configuration
 *
 * Hati focuses on Linea as the primary network for merchant wallets,
 * while supporting cross-chain payments via LiFi bridge integration.
 */

export const HATI_CONFIG = {
  // Primary Network (Merchant Wallets)
  MERCHANT_NETWORK: {
    chainId: 59144, // 0xe708
    name: 'Linea',
    symbol: 'ETH',
    explorer: 'https://lineascan.build',
    rpc: 'https://rpc.linea.build',
    usdc: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
  },

  // Circle Wallet Configuration
  CIRCLE_WALLET: {
    blockchain: 'EVM', // Generic EVM support for Linea
    accountType: 'EOA', // Externally Owned Account (receive-only)
    features: [
      'USDC receiving on Linea',
      'Transaction signing',
      'Cross-chain address consistency',
    ],
    limitations: [
      'No Gas Station (merchants pay no gas fees anyway)',
      'No SCA features (not needed for receive-only wallets)',
      'No Contract Platform (not needed for payments)',
    ],
  },

  // Supported Payment Sources (Users can pay from these)
  BRIDGE_SOURCES: [
    { chainId: 1, name: 'Ethereum', symbol: 'ETH' },
    { chainId: 42161, name: 'Arbitrum', symbol: 'ETH' },
    { chainId: 8453, name: 'Base', symbol: 'ETH' },
    { chainId: 10, name: 'Optimism', symbol: 'ETH' },
    { chainId: 137, name: 'Polygon', symbol: 'MATIC' },
    { chainId: 56, name: 'BSC', symbol: 'BNB' },
  ],

  // Payment Flow
  PAYMENT_FLOW: {
    description:
      'Users pay from any supported chain → LiFi bridges to Linea → Merchants receive USDC on Linea',
    userExperience: 'Pay with any token on any chain',
    merchantExperience: 'Receive USDC on Linea only',
    settlementTime: '8-20 seconds via CCTP',
  },

  // MetaMask Card Integration
  METAMASK_CARD: {
    verificationNetwork: 'Linea', // Verify card ownership on Linea
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
