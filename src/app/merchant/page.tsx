'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ConnectWallet from '@/components/merchant/ConnectWallet'
import CreateHatiWallet from '@/components/merchant/CreateHatiWallet'
import { merchantStorage } from '@/lib/merchantStorage'

// Types
type OnboardingStep = 'connect' | 'create-wallet' | 'completed'
type CardTier = 'Basic' | 'Premium' | 'Elite'

interface MerchantData {
  walletAddress: string
  hatiWalletAddress?: string
  hatiWalletId?: string
  cardTier: CardTier
  isNewUser: boolean
}

export default function MerchantOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('connect')
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check if user already has account and redirect to overview
  useEffect(() => {
    checkExistingConnection()
  }, [])

  const checkExistingConnection = async () => {
    try {
      // First check localStorage
      const cachedData = merchantStorage.load()
      if (cachedData) {
        console.log('Found cached merchant data, redirecting to overview')
        router.push('/merchant/overview')
        return
      }

      // Check if MetaMask is connected
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })

        if (accounts.length > 0) {
          const address = accounts[0]

          // Check for existing merchant profile via API
          try {
            const response = await fetch(
              `/api/hati/auth/merchant?address=${address}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            )

            if (response.ok) {
              // Existing user - save to cache and redirect to overview
              const userData = await response.json()
              const merchantData: MerchantData = {
                walletAddress: userData.walletAddress,
                hatiWalletAddress: userData.hatiWalletAddress,
                hatiWalletId: userData.hatiWalletId,
                cardTier: userData.cardTier,
                isNewUser: false,
              }

              merchantStorage.save(merchantData)
              router.push('/merchant/overview')
              return
            }
          } catch (apiError) {
            console.log('No existing merchant found, starting onboarding')
          }
        }
      }

      // No existing account found, proceed with onboarding
      setCurrentStep('connect')
    } catch (error) {
      console.error('Error checking connection:', error)
      setCurrentStep('connect')
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleWalletConnect = async (address: string, cardTier: CardTier) => {
    try {
      // Check if user has existing Hati account via API
      const response = await fetch(
        `/api/hati/auth/merchant?address=${address}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.ok) {
        // Existing user - save to cache and redirect to overview
        const userData = await response.json()
        const merchantData: MerchantData = {
          walletAddress: userData.walletAddress,
          hatiWalletAddress: userData.hatiWalletAddress,
          hatiWalletId: userData.hatiWalletId,
          cardTier: userData.cardTier,
          isNewUser: false,
        }

        merchantStorage.save(merchantData)
        router.push('/merchant/overview')
        return
      } else {
        // New user - proceed to wallet creation
        setMerchantData({
          walletAddress: address,
          cardTier: cardTier,
          isNewUser: true,
        })
        setCurrentStep('create-wallet')
      }
    } catch (error) {
      console.error('Error handling wallet connection:', error)
      // Fallback to new user flow
      setMerchantData({
        walletAddress: address,
        cardTier: cardTier,
        isNewUser: true,
      })
      setCurrentStep('create-wallet')
    }
  }

  const handleWalletCreation = async (walletData: {
    address: string
    walletId: string
    cardTier: CardTier
  }) => {
    if (!merchantData) return

    try {
      // Create complete merchant data object
      const completeMerchantData: MerchantData = {
        walletAddress: merchantData.walletAddress,
        hatiWalletAddress: walletData.address,
        hatiWalletId: walletData.walletId,
        cardTier: walletData.cardTier,
        isNewUser: false,
      }

      // Save to localStorage immediately
      merchantStorage.save(completeMerchantData)

      // If Premium/Elite tier, initialize yield optimization
      if (
        walletData.cardTier === 'Premium' ||
        walletData.cardTier === 'Elite'
      ) {
        try {
          await fetch('/api/hati/liquidity/optimize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              merchantAddress: walletData.address,
              riskTolerance:
                walletData.cardTier === 'Elite' ? 'aggressive' : 'moderate',
              initialAmount: 1000, // Default amount for demo
            }),
          })
        } catch (yieldError) {
          console.warn('Yield optimization setup failed:', yieldError)
          // Don't block onboarding if yield setup fails
        }
      }

      // Show completion state briefly, then redirect
      setCurrentStep('completed')
      setTimeout(() => {
        router.push('/merchant/overview')
      }, 1000)
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still redirect to overview even if there are errors
      setTimeout(() => {
        router.push('/merchant/overview')
      }, 1000)
    }
  }

  const handleCloseOnboarding = () => {
    // Clear any cached data and redirect to home page
    merchantStorage.clear()
    router.push('/')
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Render onboarding steps
  if (currentStep === 'connect') {
    return (
      <ConnectWallet
        onConnect={handleWalletConnect}
        onClose={handleCloseOnboarding}
      />
    )
  }

  if (currentStep === 'create-wallet' && merchantData) {
    return (
      <CreateHatiWallet
        onComplete={handleWalletCreation}
        onClose={handleCloseOnboarding}
        connectedAddress={merchantData.walletAddress}
        preVerifiedCardTier={merchantData.cardTier}
      />
    )
  }

  if (currentStep === 'completed') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
            <svg
              className="w-8 h-8 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Setup Complete!
          </h2>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
