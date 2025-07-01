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
}

interface MetaMaskAccount {
  address: string
  provider: any
}

export const useMetaMask = () => {
  const [sdk, setSdk] = useState<MetaMaskSDK | null>(null)
  const [account, setAccount] = useState<MetaMaskAccount | null>(null)
  const [cardTier, setCardTier] = useState<CardTier | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVerifyingCard, setIsVerifyingCard] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // MetaMask Card contract addresses on Linea
  const CARD_CONTRACTS = {
    US_RESIDENTS: '0xA90b298d05C2667dDC64e2A4e17111357c215dD2' as const,
    INTERNATIONAL: '0x9dd23A4a0845f10d65D293776B792af1131c7B30' as const,
  }

  // Initialize SDK with dynamic import
  useEffect(() => {
    const initSDK = async () => {
      try {
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
        setSdk(metamaskSDK)
      } catch (error) {
        console.error('Failed to load MetaMask SDK:', error)
      }
    }

    // Only initialize on client side
    if (typeof window !== 'undefined') {
      initSDK()
    }
  }, [])

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const accounts = await sdk?.connect()
      const provider = sdk?.getProvider()

      const accountData = {
        address: accounts?.[0],
        provider,
      }

      setAccount(accountData as MetaMaskAccount)
      return accountData
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet')
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [sdk])

  const verifyMetaMaskCard = useCallback(
    async (address: string) => {
      if (!account?.provider) {
        throw new Error('Wallet not connected')
      }

      setIsVerifyingCard(true)
      setError(null)

      try {
        const lineaClient = createPublicClient({
          chain: linea,
          transport: http(),
        })

        // Check delegation amounts on both contracts
        const [usDelegation, intlDelegation] = await Promise.allSettled([
          getDelegationAmount(
            lineaClient,
            CARD_CONTRACTS.US_RESIDENTS,
            address as `0x${string}`,
          ),
          getDelegationAmount(
            lineaClient,
            CARD_CONTRACTS.INTERNATIONAL,
            address as `0x${string}`,
          ),
        ])

        const usDelegationAmount =
          usDelegation.status === 'fulfilled' ? usDelegation.value : 0n
        const intlDelegationAmount =
          intlDelegation.status === 'fulfilled' ? intlDelegation.value : 0n

        const totalDelegation = usDelegationAmount + intlDelegationAmount
        const hasCard = totalDelegation > 0n

        if (!hasCard) {
          const basicTier: CardTier = {
            hasCard: false,
            tier: 'basic',
            benefits: ['Standard fees', 'Basic features'],
          }
          setCardTier(basicTier)
          return basicTier
        }

        // Get wallet balance for tier calculation
        const balance = await account.provider.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        })

        const balanceInEth = parseInt(balance, 16) / 1e18
        const delegationInEth = Number(totalDelegation) / 1e18
        const equivalentValue = balanceInEth + delegationInEth

        let tier: 'basic' | 'premium' | 'elite' = 'basic'
        let benefits: string[] = []

        if (equivalentValue >= 10) {
          tier = 'elite'
          benefits = [
            '0% transaction fees',
            'Advanced yield strategies',
            'Priority support',
            'White-glove onboarding',
            'Custom integrations',
          ]
        } else if (equivalentValue >= 1) {
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

        const cardData: CardTier = {
          hasCard: true,
          tier,
          benefits,
          delegationAmount: (Number(totalDelegation) / 1e18).toFixed(4),
        }

        setCardTier(cardData)
        return cardData
      } catch (err: any) {
        console.error('Card verification failed:', err)
        const basicTier: CardTier = {
          hasCard: false,
          tier: 'basic',
          benefits: ['Standard fees', 'Basic features'],
        }
        setCardTier(basicTier)
        return basicTier
      } finally {
        setIsVerifyingCard(false)
      }
    },
    [account, CARD_CONTRACTS],
  )

  const getDelegationAmount = useCallback(
    async (
      client: any,
      contractAddress: `0x${string}`,
      userAddress: `0x${string}`,
    ): Promise<bigint> => {
      try {
        const delegationAbi = [
          {
            inputs: [{ name: 'delegator', type: 'address' }],
            name: 'delegated',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
        ] as const

        const result = await client.readContract({
          address: contractAddress,
          abi: delegationAbi,
          functionName: 'delegated',
          args: [userAddress],
        })

        return result as bigint
      } catch (error) {
        console.error(
          `Failed to get delegation from ${contractAddress}:`,
          error,
        )
        return 0n
      }
    },
    [],
  )

  const switchToLinea = useCallback(async (): Promise<boolean> => {
    if (!account?.provider) {
      throw new Error('Wallet not connected')
    }

    try {
      await account.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xe708' }], // Linea mainnet
      })
      return true
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await account.provider.request({
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
  }, [account])

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
      const accountData = await connectWallet()
      const cardData = await verifyMetaMaskCard(accountData?.address || '')
      return { account: accountData, cardTier: cardData }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [connectWallet, verifyMetaMaskCard])

  return {
    // State
    account,
    cardTier,
    isConnecting,
    isVerifyingCard,
    error,
    isConnected: !!account,

    // Actions
    connectWallet,
    verifyMetaMaskCard,
    connectAndVerify,
    switchToLinea,
    disconnect,
  }
}
