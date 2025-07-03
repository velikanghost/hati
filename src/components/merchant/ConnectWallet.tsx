'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  RiWallet3Line,
  RiCloseLine,
  RiTrophyLine,
  RiShieldCheckLine,
} from 'react-icons/ri'
import { useMetaMask } from '@/hooks/useMetaMask'

interface ConnectWalletProps {
  onConnect: (address: string, cardTier: 'Basic' | 'Premium' | 'Elite') => void
  onClose: () => void
}

export default function ConnectWallet({
  onConnect,
  onClose,
}: ConnectWalletProps) {
  const [step, setStep] = useState<
    'connect' | 'connected' | 'verifying' | 'success'
  >('connect')
  const [connectedAddress, setConnectedAddress] = useState<string>('')
  const {
    connectWallet,
    verifyMetaMaskCard,
    isConnecting,
    isVerifyingCard,
    error,
  } = useMetaMask()

  const handleConnect = async () => {
    try {
      // Just connect wallet without auto-verification
      const accountData = await connectWallet()

      if (!accountData?.address) {
        throw new Error('Failed to connect wallet')
      }

      setConnectedAddress(accountData.address)
      setStep('connected')
    } catch (err: any) {
      console.error('Connection error:', err)
      setStep('connect')
    }
  }

  const handleSkipVerification = () => {
    // Connect with basic tier
    onConnect(connectedAddress, 'Basic')
  }

  const handleVerifyCard = async () => {
    try {
      setStep('verifying')

      // Verify MetaMask Card on Linea
      const cardData = await verifyMetaMaskCard(
        connectedAddress,
        window.ethereum,
      )

      if (!cardData) {
        throw new Error('Failed to verify card')
      }

      setStep('success')

      // Convert card tier format
      const tierMap = {
        basic: 'Basic' as const,
        premium: 'Premium' as const,
        elite: 'Elite' as const,
      }

      const mappedTier = tierMap[cardData.tier || 'basic']

      // Complete connection after showing success
      setTimeout(() => {
        onConnect(connectedAddress, mappedTier)
      }, 2000)
    } catch (err: any) {
      console.error('Verification error:', err)
      // Fall back to basic tier on verification failure
      setStep('connected')
    }
  }

  const isLoading = isConnecting || isVerifyingCard

  // Connect step
  if (step === 'connect') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <Card className="relative w-[80%] max-w-md p-8 bg-white shadow-2xl">
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
                Connect Your Wallet
              </h2>
              <p className="text-gray-600">
                Connect your MetaMask wallet to access the Hati merchant
                dashboard
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full py-6 text-lg font-medium text-white bg-orange-500 hover:bg-orange-600"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#F68E56">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  Connect with MetaMask
                </div>
              </Button>
            </div>

            <div className="pt-6 border-t">
              <h3 className="mb-3 text-sm font-medium text-gray-900">
                Why connect your wallet?
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Secure authentication without passwords
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Access to merchant dashboard
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Receive payments directly to your wallet
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Connected step - show card verification option
  if (step === 'connected') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <Card className="relative w-[80%] max-w-md p-8 bg-white shadow-2xl">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                <RiTrophyLine className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Wallet Connected!
              </h2>
              <p className="text-gray-600">
                {`${connectedAddress.substring(
                  0,
                  6,
                )}...${connectedAddress.substring(38)}`}
              </p>
            </div>

            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full">
                <RiShieldCheckLine className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-blue-900">
                Verify Your MetaMask Card
              </h3>
              <p className="mb-4 text-sm text-blue-700">
                Do you have a MetaMask Card? Verify it to unlock premium
                benefits:
              </p>
              <div className="space-y-1 text-xs text-blue-600">
                <div>• Reduced transaction fees</div>
                <div>• Priority customer support</div>
                <div>• Advanced yield strategies</div>
                <div>• Enhanced security features</div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleVerifyCard}
                disabled={isLoading}
                className="w-full py-3 font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Verify MetaMask Card
              </Button>

              <Button
                onClick={handleSkipVerification}
                variant="outline"
                className="w-full py-3 font-medium"
              >
                Continue without verification
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Don't have a MetaMask Card?{' '}
              <a
                href="https://metamask.io/card"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Verifying step
  if (step === 'verifying') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <Card className="relative w-[80%] max-w-md p-8 bg-white shadow-2xl">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full">
                <div className="w-8 h-8 border-2 border-blue-600 rounded-full border-t-transparent animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Verifying MetaMask Card...
              </h2>
              <p className="text-gray-600">
                Checking your MetaMask Card status on Linea network
              </p>
            </div>

            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 rounded-full border-t-transparent animate-spin" />
                <span className="text-sm text-blue-700">
                  Verifying card tier and benefits...
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
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

        <Card className="relative w-[80%] max-w-md p-8 bg-white shadow-2xl">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                <RiTrophyLine className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Card Verified Successfully!
              </h2>
              <p className="text-gray-600">
                Your MetaMask Card has been verified
              </p>
            </div>

            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">✅</span>
                  <span className="font-medium text-green-700">
                    Verification Complete
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  Redirecting to your dashboard...
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
