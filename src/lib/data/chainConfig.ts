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
}
