interface Network {
  chainId: string
  rpcUrls: string[]
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockExplorerUrls: string[]
}

type Networks = {
  [key: string]: Network
}

export const networks: Networks = {
  // Hati Primary Network - Linea (Merchant wallets)
  '0xe708': {
    chainId: '0xe708',
    rpcUrls: ['https://rpc.linea.build'],
    chainName: 'Linea',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://lineascan.build'],
  },

  // Bridge Source Networks (Users can pay from these chains, bridged to Linea)
  '0xa4b1': {
    chainId: '0xa4b1',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  '0x2105': {
    chainId: '0x2105',
    rpcUrls: ['https://mainnet.base.org'],
    chainName: 'Base',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://basescan.org'],
  },
  '0xa': {
    chainId: '0xa',
    rpcUrls: ['https://mainnet.optimism.io'],
    chainName: 'Optimism',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
  },
  '0x1': {
    chainId: '0x1',
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'],
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://etherscan.io'],
  },

  // Legacy Testnet Networks (deprecated)
  '0xaa36a7': {
    chainId: '0xaa36a7',
    rpcUrls: [`https://sepolia.base.org`],
    chainName: 'Base Sepolia',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://base-sepolia.blockscout.com'],
  },
  '0x14a34': {
    chainId: '0x14a34',
    rpcUrls: [`https://sepolia.infura.io`],
    chainName: 'Sepolia',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://eth-sepolia.blockscout.com'],
  },
  '0x66eee': {
    chainId: '0x66eee',
    rpcUrls: [`https://sepolia-rollup.arbitrum.io/rpc`],
    chainName: 'Arbitrum Sepolia',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://arbitrum-sepolia.blockscout.com/'],
  },
  '0xaa37dc': {
    chainId: '0xaa37dc',
    rpcUrls: [`https://sepolia.optimism.io`],
    chainName: 'Optimism Sepolia',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://optimism-sepolia.blockscout.com/'],
  },
  '0xa869': {
    chainId: '0xa869',
    rpcUrls: [`https://api.avax.network/ext/bc/c/rpc`],
    chainName: 'Avalanche',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    blockExplorerUrls: ['https://subnets-test.avax.network/c-chain'],
  },
  '0xaef3': {
    chainId: '0xaef3',
    rpcUrls: [`https://alfajores-forno.celo-testnet.org`],
    chainName: 'Celo',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
    },
    blockExplorerUrls: ['https://celo-alfajores.blockscout.com/'],
  },
}
