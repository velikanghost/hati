'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  RiWallet3Line,
  RiCloseLine,
  RiExchangeLine,
  RiTrophyLine,
} from 'react-icons/ri'

interface CreateHatiWalletProps {
  onComplete: (walletData: {
    address: string
    walletId: string
    cardTier: 'Basic' | 'Premium' | 'Elite'
  }) => void
  onClose: () => void
  connectedAddress: string
  // Add pre-verified card tier to skip re-verification
  preVerifiedCardTier?: 'Basic' | 'Premium' | 'Elite'
}

export default function CreateHatiWallet({
  onComplete,
  onClose,
  connectedAddress,
  preVerifiedCardTier,
}: CreateHatiWalletProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [step, setStep] = useState<'creating' | 'success'>(
    // Skip verification if we already have card tier from ConnectWallet
    'creating',
  )
  const [error, setError] = useState('')

  // Use pre-verified card tier or default to Basic
  const cardTier = preVerifiedCardTier || 'Basic'

  const createHatiWallet = async () => {
    setIsCreating(true)
    setError('')

    try {
      // Step 1: Create Circle Wallet
      const circleResponse = await fetch('/api/circle/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: connectedAddress,
          cardTier: cardTier.toLowerCase(),
        }),
      })

      if (!circleResponse.ok) {
        const errorData = await circleResponse.json()
        throw new Error(errorData.error || 'Failed to create Circle wallet')
      }

      const walletData = await circleResponse.json()

      // Step 2: Create Merchant Profile with wallet data
      const merchantResponse = await fetch('/api/hati/auth/merchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: connectedAddress,
          hatiWalletAddress: walletData.address,
          hatiWalletId: walletData.id,
          cardTier: cardTier,
          businessName: 'My Business', // Default name, can be updated later
          businessType: 'e-commerce',
        }),
      })

      if (!merchantResponse.ok) {
        const errorData = await merchantResponse.json()
        throw new Error(errorData.error || 'Failed to create merchant profile')
      }

      const merchantData = await merchantResponse.json()

      setStep('success')

      // Complete onboarding after showing success
      setTimeout(() => {
        onComplete({
          address: walletData.address,
          walletId: walletData.id,
          cardTier: cardTier,
        })
      }, 2000)
    } catch (err: any) {
      console.error('Hati wallet creation error:', err)
      setError(err.message || 'Failed to create Hati wallet')
    } finally {
      setIsCreating(false)
    }
  }

  const getCardBenefits = () => {
    switch (cardTier) {
      case 'Elite':
        return {
          fees: '0% transaction fees',
          yield: 'Advanced yield strategies',
          support: 'Priority support',
          color: 'purple',
          features: [
            '0% transaction fees',
            'Priority customer support',
            'Advanced yield strategies',
            'Exclusive DeFi partnerships',
            'Custom spending limits',
          ],
        }
      case 'Premium':
        return {
          fees: '50% reduced fees',
          yield: 'Automated yield optimization',
          support: 'Enhanced support',
          color: 'blue',
          features: [
            '50% reduced transaction fees',
            'Automated yield optimization',
            'Monthly performance reports',
            'Enhanced security features',
          ],
        }
      default:
        return {
          fees: 'Standard fees',
          yield: 'Basic optimization',
          support: 'Community support',
          color: 'gray',
          features: [
            'Standard transaction fees',
            'Basic yield optimization',
            'Community support',
          ],
        }
    }
  }

  const benefits = getCardBenefits()

  // Creating step
  if (step === 'creating') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <Card className="relative w-[80%] max-w-lg p-8 bg-white shadow-2xl">
          <button
            onClick={onClose}
            className="absolute p-2 text-gray-400 transition-colors top-4 right-4 hover:text-gray-600"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>

          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 rounded-full">
                <RiWallet3Line className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create Your Hati Wallet
              </h2>
              <p className="text-gray-600">
                Setting up your secure payment wallet powered by Circle
              </p>
            </div>

            <div className="p-4 text-left rounded-lg bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <RiWallet3Line className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Connected Wallet</p>
                  <p className="font-mono text-sm text-gray-600">
                    {connectedAddress.slice(0, 6)}...
                    {connectedAddress.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Card Tier:</span>
                  <Badge
                    className={`${
                      benefits.color === 'purple'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : benefits.color === 'blue'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {cardTier}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Benefits Display */}
            <div className="p-4 text-left rounded-lg bg-gray-50">
              <h3 className="mb-3 font-medium text-gray-900">Your Benefits:</h3>
              <div className="space-y-2">
                {benefits.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              onClick={createHatiWallet}
              disabled={isCreating}
              className="w-full py-6 text-lg font-medium text-white bg-orange-500 hover:bg-orange-600"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                  Creating Hati Wallet...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <RiExchangeLine className="w-6 h-6" />
                  Create Hati Wallet
                </div>
              )}
            </Button>

            <div className="pt-6 border-t">
              <h3 className="mb-3 text-sm font-medium text-gray-900">
                What we're creating
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Secure Circle programmable wallet
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Multi-chain USDC payment capabilities
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Automated yield optimization (Premium/Elite)
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Success step
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <Card className="relative w-[80%] max-w-lg p-8 bg-white shadow-2xl">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                <RiTrophyLine className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Setup Complete!
              </h2>
              <p className="text-gray-600">
                Your Hati merchant account is ready
              </p>
            </div>

            <div className="p-6 border-2 border-green-200 rounded-lg bg-green-50">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <span className="font-medium text-green-800">
                    Welcome to Hati!
                  </span>
                </div>
                <p className="text-sm text-green-700">
                  Your merchant dashboard is being prepared...
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
