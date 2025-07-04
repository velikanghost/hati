import { createConfig, EVM } from '@lifi/sdk'
import { createWalletClient, custom } from 'viem'

export const initializeLiFiSDK = (provider: any, account: string) => {
  try {
    console.log('🔄 Initializing LiFi SDK with:', {
      hasProvider: !!provider,
      account,
      providerType: provider?.constructor?.name,
    })

    if (!provider) {
      console.error('❌ No provider available')
      return false
    }

    if (!account) {
      console.error('❌ No account address provided')
      return false
    }

    // Validate provider has required methods
    const requiredMethods = ['request', 'send', 'sendAsync']
    const hasRequiredMethods = requiredMethods.some(
      (method) => typeof provider[method] === 'function',
    )
    if (!hasRequiredMethods) {
      console.error('❌ Provider missing required methods:', {
        available: Object.keys(provider),
        required: requiredMethods,
      })
      return false
    }

    // Get current chain ID from provider
    const getCurrentChainId = async () => {
      try {
        const chainIdHex = await provider.request({ method: 'eth_chainId' })
        return parseInt(chainIdHex, 16)
      } catch (error) {
        console.warn(
          'Failed to get chain ID from provider, using mainnet:',
          error,
        )
        return 1 // Default to mainnet
      }
    }

    // Create wallet client using MetaMask provider
    const setupWalletClient = async () => {
      const chainId = await getCurrentChainId()
      console.log('🔄 Creating wallet client for chain:', chainId)

      return createWalletClient({
        account: account as `0x${string}`,
        transport: custom(provider),
        chain: {
          id: chainId,
          name: 'Chain ' + chainId,
          network: 'ethereum',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: [''] }, // Empty as we're using the provider directly
            public: { http: [''] },
          },
        },
      })
    }

    // Configure LiFi SDK with EVM provider
    console.log('🔄 Configuring LiFi SDK...')
    createConfig({
      integrator: 'hati-metamask-hackathon',
      providers: [
        EVM({
          getWalletClient: async () => {
            console.log('🔄 Getting wallet client for LiFi...')
            return setupWalletClient()
          },
          switchChain: async (chainId) => {
            try {
              console.log('🔄 Switching chain:', chainId)
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
              })

              // Return updated wallet client with new chain
              return setupWalletClient()
            } catch (error) {
              console.error('❌ Chain switch failed:', error)
              throw error
            }
          },
        }),
      ],
    })

    console.log('✅ LiFi SDK configuration complete')
    return true
  } catch (error) {
    console.error('❌ Failed to configure LiFi SDK:', error)
    return false
  }
}
