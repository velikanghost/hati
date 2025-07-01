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
