//Hati Mainnet - Linea focused for merchant wallets
export const chains = [
  {
    title: 'Linea',
    explorer: 'https://lineascan.build',
    icon: 'linea.svg',
  },
]

// Other supported chains for user payments (bridged to Linea)
export const bridgeSourceChains = [
  {
    title: 'Ethereum',
    explorer: 'https://etherscan.io',
    icon: 'eth.svg',
  },
  {
    title: 'Arbitrum',
    explorer: 'https://arbiscan.io',
    icon: 'arbitrum.svg',
  },
  {
    title: 'Base',
    explorer: 'https://basescan.org',
    icon: 'base.svg',
  },
  {
    title: 'Optimism',
    explorer: 'https://optimistic.etherscan.io',
    icon: 'optimism.svg',
  },
]

//Legacy Testnet (deprecated)
export const testnetChains = [
  {
    title: 'Sepolia',
    explorer: 'https://sepolia.etherscan.io',
    icon: 'eth.svg',
  },
  {
    title: 'Base Sepolia',
    explorer: 'https://base-sepolia.blockscout.com',
    icon: 'base.svg',
  },
  {
    title: 'Optimism Sepolia',
    explorer: 'https://sepolia-optimism.etherscan.io',
    icon: 'optimism.svg',
  },
  {
    title: 'Arbitrum Sepolia',
    explorer: 'https://sepolia.arbiscan.io',
    icon: 'arbitrum.svg',
  },
]
