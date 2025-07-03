'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { linea } from 'viem/chains'

// Type definition for dynamically imported MetaMask SDK
type MetaMaskSDK = any

export interface CardTier {
  hasCard: boolean
  tier: 'basic' | 'premium' | 'elite'
  benefits: string[]
  delegationAmount?: string
  contractInteractions?: number
}

interface MetaMaskAccount {
  address: string
  provider: any
}

// Move constants outside component to prevent recreation on every render
const CARD_CONTRACTS = {
  US_RESIDENTS: '0xA90b298d05C2667dDC64e2A4e17111357c215dD2' as const,
  INTERNATIONAL: '0x9dd23A4a0845f10d65D293776B792af1131c7B30' as const,
}

// FoxConnect ABI for international users
const FOX_CONNECT_ABI = [
  {
    inputs: [],
    name: 'getTreasuries',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMultiSendOperators',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWithdrawOperators',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const useMetaMask = () => {
  const [sdk, setSdk] = useState<MetaMaskSDK | null>(null)
  const [account, setAccount] = useState<MetaMaskAccount | null>(null)
  const [cardTier, setCardTier] = useState<CardTier | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVerifyingCard, setIsVerifyingCard] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize SDK with dynamic import
  useEffect(() => {
    const initSDK = async () => {
      try {
        console.log('🔄 Initializing MetaMask SDK...')
        const { default: MetaMaskSDK } = await import('@metamask/sdk')
        const metamaskSDK = new MetaMaskSDK({
          dappMetadata: {
            name: 'Hati Payment Gateway',
            url: 'https://hati-payment.vercel.app',
            iconUrl: 'https://hati-payment.vercel.app/images/logo.jpg',
          },
          preferDesktop: false,
          checkInstallationImmediately: false,
        })

        // Wait for SDK to be ready
        await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log('✅ MetaMask SDK initialized:', {
          hasSDK: !!metamaskSDK,
          hasProvider: !!metamaskSDK?.getProvider(),
        })

        setSdk(metamaskSDK)

        // If we already have a connection, update the account
        if (metamaskSDK.getProvider()?.selectedAddress) {
          const provider = metamaskSDK.getProvider()
          setAccount({
            address: provider?.selectedAddress || '',
            provider,
          })
          console.log(
            '🔄 Restored existing connection:',
            provider?.selectedAddress,
          )
        }
      } catch (error) {
        console.error('❌ Failed to load MetaMask SDK:', error)
      }
    }

    // Only initialize on client side
    if (typeof window !== 'undefined') {
      console.log('🌐 Running in browser, starting SDK init...')
      initSDK()
    } else {
      console.log('⚠️ Not in browser, skipping SDK init')
    }
  }, [])

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      console.log('🔄 Connecting wallet with SDK:', !!sdk)
      if (!sdk) {
        throw new Error('MetaMask SDK not initialized')
      }

      const provider = sdk.getProvider()
      console.log('🔍 Provider check:', {
        hasProvider: !!provider,
        isConnected: !!provider?.isConnected?.(),
        selectedAddress: provider?.selectedAddress,
      })

      const accounts = await sdk.connect()
      console.log('✅ Got accounts:', accounts)

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const accountData = {
        address: accounts[0],
        provider,
      }

      console.log('✅ Setting account:', accountData)
      setAccount(accountData as MetaMaskAccount)
      return accountData
    } catch (err: any) {
      console.error('❌ Connect wallet error:', err)
      setError(err.message || 'Failed to connect wallet')
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [sdk])

  const switchToLinea = useCallback(
    async (provider?: any): Promise<boolean> => {
      const targetProvider = provider || account?.provider

      if (!targetProvider) {
        throw new Error('Wallet not connected')
      }

      try {
        await targetProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xe708' }], // Linea mainnet
        })
        return true
      } catch (error: any) {
        if (error.code === 4902) {
          try {
            await targetProvider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xe708',
                  chainName: 'Linea',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc.linea.build'],
                  blockExplorerUrls: ['https://lineascan.build'],
                },
              ],
            })
            return true
          } catch (addError) {
            console.error('Failed to add Linea network:', addError)
            return false
          }
        }
        console.error('Failed to switch to Linea:', error)
        return false
      }
    },
    [account],
  )

  const checkCardInteractions = useCallback(
    async (
      client: any,
      contractAddress: `0x${string}`,
      userAddress: `0x${string}`,
    ): Promise<number> => {
      try {
        // For FoxConnect (international), check if user is in operator lists
        if (contractAddress === CARD_CONTRACTS.INTERNATIONAL) {
          const [treasuries, multiSendOps, withdrawOps] =
            await Promise.allSettled([
              client.readContract({
                address: contractAddress,
                abi: FOX_CONNECT_ABI,
                functionName: 'getTreasuries',
              }),
              client.readContract({
                address: contractAddress,
                abi: FOX_CONNECT_ABI,
                functionName: 'getMultiSendOperators',
              }),
              client.readContract({
                address: contractAddress,
                abi: FOX_CONNECT_ABI,
                functionName: 'getWithdrawOperators',
              }),
            ])

          let interactions = 0

          // Check if user is in any of the operator lists (indicates card usage)
          if (treasuries.status === 'fulfilled') {
            const treasuryList = treasuries.value as string[]
            if (
              treasuryList.some(
                (addr: string) =>
                  addr.toLowerCase() === userAddress.toLowerCase(),
              )
            ) {
              interactions += 5 // Treasury = high interaction
            }
          }

          if (multiSendOps.status === 'fulfilled') {
            const opList = multiSendOps.value as string[]
            if (
              opList.some(
                (addr: string) =>
                  addr.toLowerCase() === userAddress.toLowerCase(),
              )
            ) {
              interactions += 3 // Operator = medium interaction
            }
          }

          if (withdrawOps.status === 'fulfilled') {
            const withdrawList = withdrawOps.value as string[]
            if (
              withdrawList.some(
                (addr: string) =>
                  addr.toLowerCase() === userAddress.toLowerCase(),
              )
            ) {
              interactions += 3 // Withdraw operator = medium interaction
            }
          }

          return interactions
        }

        // For US contract, check transaction history via events
        // This is a simplified check - in production you'd parse actual events
        try {
          const logs = await client.getLogs({
            address: contractAddress,
            fromBlock: 'earliest',
            toBlock: 'latest',
          })

          // Count logs where user appears (simplified)
          const userInteractions = logs.filter((log: any) =>
            log.topics.some((topic: string) =>
              topic.toLowerCase().includes(userAddress.slice(2).toLowerCase()),
            ),
          ).length

          return Math.min(userInteractions, 20) // Cap at 20 for demo
        } catch (logError) {
          console.log('Could not fetch logs, using fallback method')
          return 0
        }
      } catch (error) {
        console.error(
          `Failed to check card interactions for ${contractAddress}:`,
          error,
        )
        return 0
      }
    },
    [], // No dependencies needed since constants are now outside component
  )

  const verifyMetaMaskCard = useCallback(
    async (address: string, provider: any) => {
      setIsVerifyingCard(true)
      setError(null)

      try {
        const lineaClient = createPublicClient({
          chain: linea,
          transport: http(),
        })

        // Check if address has interacted with MetaMask Card contracts
        const [usCardData, intlCardData] = await Promise.allSettled([
          checkCardInteractions(
            lineaClient,
            CARD_CONTRACTS.US_RESIDENTS,
            address as `0x${string}`,
          ),
          checkCardInteractions(
            lineaClient,
            CARD_CONTRACTS.INTERNATIONAL,
            address as `0x${string}`,
          ),
        ])

        const usInteractions =
          usCardData.status === 'fulfilled' ? usCardData.value : 0
        const intlInteractions =
          intlCardData.status === 'fulfilled' ? intlCardData.value : 0
        const totalInteractions = usInteractions + intlInteractions

        // Check wallet balance for additional tier calculation
        const balance = await provider.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        })

        const balanceInEth = parseInt(balance, 16) / 1e18
        const hasCard = totalInteractions > 0

        let tier: 'basic' | 'premium' | 'elite' = 'basic'
        let benefits: string[] = []

        if (hasCard) {
          // Determine tier based on interaction frequency and balance
          if (totalInteractions >= 10 && balanceInEth >= 5) {
            tier = 'elite'
            benefits = [
              '0% transaction fees',
              'Advanced yield strategies',
              'Priority support',
              'White-glove onboarding',
              'Custom integrations',
            ]
          } else if (totalInteractions >= 3 && balanceInEth >= 1) {
            tier = 'premium'
            benefits = [
              '50% reduced fees',
              'Automated optimization',
              'Monthly reports',
              'Enhanced security',
              'Priority processing',
            ]
          } else {
            tier = 'basic'
            benefits = [
              'Standard fees',
              'Basic yield optimization',
              'Community support',
              'Email notifications',
            ]
          }
        } else {
          // No card detected
          benefits = ['Standard fees', 'Basic features', 'Community support']
        }

        const cardData: CardTier = {
          hasCard,
          tier,
          benefits,
          contractInteractions: totalInteractions,
          delegationAmount: balanceInEth.toFixed(4),
        }

        setCardTier(cardData)
        return cardData
      } catch (err: any) {
        console.error('Card verification failed:', err)
        // Return basic tier as fallback
        const basicTier: CardTier = {
          hasCard: false,
          tier: 'basic',
          benefits: ['Standard fees', 'Basic features'],
          contractInteractions: 0,
        }
        setCardTier(basicTier)
        return basicTier
      } finally {
        setIsVerifyingCard(false)
      }
    },
    [checkCardInteractions],
  )

  const disconnect = useCallback(async () => {
    if (sdk) {
      await sdk.terminate()
    }
    setAccount(null)
    setCardTier(null)
    setError(null)
  }, [sdk])

  const connectAndVerify = useCallback(async () => {
    try {
      // Step 1: Connect wallet
      const accountData = await connectWallet()

      if (!accountData?.address || !accountData?.provider) {
        throw new Error('Failed to connect wallet')
      }

      // Step 2: Switch to Linea network
      const switchSuccess = await switchToLinea(accountData.provider)
      if (!switchSuccess) {
        throw new Error('Please switch to Linea network to continue')
      }

      // Step 3: Verify MetaMask Card
      const cardData = await verifyMetaMaskCard(
        accountData.address,
        accountData.provider,
      )

      return { account: accountData, cardTier: cardData }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [connectWallet, switchToLinea, verifyMetaMaskCard])

  return {
    // State
    account,
    cardTier,
    isConnecting,
    isVerifyingCard,
    error,
    isConnected: !!account,
    sdk,

    // Actions
    connectWallet,
    verifyMetaMaskCard,
    connectAndVerify,
    switchToLinea,
    disconnect,
  }
}
