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

    // Create wallet client using MetaMask provider
    console.log('🔄 Creating wallet client...')
    const walletClient = createWalletClient({
      account: account as `0x${string}`,
      transport: custom(provider),
    })

    console.log('✅ Wallet client created')

    // Configure LiFi SDK with EVM provider
    console.log('🔄 Configuring LiFi SDK...')
    createConfig({
      integrator: 'hati-metamask-hackathon',
      providers: [
        EVM({
          getWalletClient: async () => {
            console.log('🔄 Getting wallet client for LiFi...')
            return walletClient
          },
          switchChain: async (chainId) => {
            try {
              console.log('🔄 Switching chain:', chainId)
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
              })

              // Return updated wallet client
              return createWalletClient({
                account: account as `0x${string}`,
                transport: custom(provider),
              })
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
