'use client'

import { useState, useEffect } from 'react'
import MerchantDashboardLayout from '@/components/layouts/merchantDashboard'
import ConnectWallet from '@/components/merchant/ConnectWallet'
import CreateHatiWallet from '@/components/merchant/CreateHatiWallet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  RiWallet3Line,
  RiExchangeLine,
  RiLineChartLine,
  RiArrowRightLine,
  RiCopyleftLine,
  RiEyeLine,
  RiTrophyLine,
} from 'react-icons/ri'

// Types
type OnboardingStep = 'connect' | 'create-wallet' | 'dashboard'
type CardTier = 'Basic' | 'Premium' | 'Elite'

interface MerchantData {
  walletAddress: string
  hatiWalletAddress?: string
  hatiWalletId?: string
  cardTier: CardTier
  isNewUser: boolean
}

// Mock data for hackathon demo
const mockStats = {
  totalPayments: 847,
  totalVolume: 125420.5,
  monthlyGrowth: 23.5,
  yieldEarned: 2341.8,
  avgTransactionTime: 12, // seconds
  successRate: 99.8,
}

const mockRecentTransactions = [
  {
    id: 'tx_001',
    from: '0x1234...5678',
    amount: 250.0,
    token: 'USDC',
    chain: 'Arbitrum',
    status: 'completed',
    timestamp: '2 minutes ago',
    txHash: '0xabcd...efgh',
  },
  {
    id: 'tx_002',
    from: '0x9876...5432',
    amount: 89.99,
    token: 'USDC',
    chain: 'Optimism',
    status: 'completed',
    timestamp: '8 minutes ago',
    txHash: '0x1234...5678',
  },
  {
    id: 'tx_003',
    from: '0x5555...9999',
    amount: 1500.0,
    token: 'USDC',
    chain: 'Base',
    status: 'processing',
    timestamp: '12 minutes ago',
    txHash: '0x9999...1111',
  },
]

export default function MerchantDashboard() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('connect')
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check if user is connected and has existing account
  useEffect(() => {
    checkExistingConnection()
  }, [])

  const checkExistingConnection = async () => {
    try {
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
              // Existing user - load their data and go to dashboard
              const userData = await response.json()
              setMerchantData({
                walletAddress: userData.walletAddress,
                hatiWalletAddress: userData.hatiWalletAddress,
                hatiWalletId: userData.hatiWalletId,
                cardTier: userData.cardTier,
                isNewUser: false,
              })
              setCurrentStep('dashboard')
            } else {
              // No existing account - need full onboarding with card verification
              setCurrentStep('connect')
            }
          } catch (apiError) {
            console.log('No existing merchant found, starting onboarding')
            setCurrentStep('connect')
          }
        } else {
          // No wallet connected
          setCurrentStep('connect')
        }
      } else {
        // MetaMask not installed
        setCurrentStep('connect')
      }
    } catch (error) {
      console.error('Error checking connection:', error)
      setCurrentStep('connect')
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
        // Existing user - load their data but update card tier
        const userData = await response.json()

        // Update card tier via API
        const updateResponse = await fetch('/api/hati/auth/merchant', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: address,
            cardTier: cardTier,
          }),
        })

        if (updateResponse.ok) {
          const updatedUserData = await updateResponse.json()
          setMerchantData({
            walletAddress: updatedUserData.walletAddress,
            hatiWalletAddress: updatedUserData.hatiWalletAddress,
            hatiWalletId: updatedUserData.hatiWalletId,
            cardTier: updatedUserData.cardTier,
            isNewUser: false,
          })
          setCurrentStep('dashboard')
        } else {
          throw new Error('Failed to update card tier')
        }
      } else {
        // New user
        setMerchantData({
          walletAddress: address,
          cardTier: cardTier, // Real card tier from verification
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

    // Merchant profile is already created by CreateHatiWallet component
    const updatedMerchantData = {
      walletAddress: merchantData.walletAddress,
      hatiWalletAddress: walletData.address,
      hatiWalletId: walletData.walletId,
      cardTier: walletData.cardTier,
      isNewUser: false,
    }

    // If Premium/Elite tier, initialize yield optimization
    if (walletData.cardTier === 'Premium' || walletData.cardTier === 'Elite') {
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

    setMerchantData(updatedMerchantData)
    setCurrentStep('dashboard')
  }

  const handleCloseOnboarding = () => {
    // For demo purposes, just go back to connect step
    setCurrentStep('connect')
    setMerchantData(null)
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

  // Dashboard view (existing user or completed onboarding)
  if (currentStep === 'dashboard' && merchantData) {
    const widgetCode = `<script src="https://hati-payment.vercel.app/widget.js"></script>
<div id="hati-pay" 
     data-merchant="${merchantData.walletAddress}" 
     data-amount="100" 
     data-currency="USDC">
</div>`

    const copyWidgetCode = () => {
      navigator.clipboard.writeText(widgetCode)
      // Toast notification would go here
    }

    const getCardBenefits = () => {
      switch (merchantData.cardTier) {
        case 'Elite':
          return {
            fees: '0% transaction fees',
            yield: 'Advanced yield strategies',
            support: 'Priority support',
            color: 'purple',
          }
        case 'Premium':
          return {
            fees: '50% reduced fees',
            yield: 'Automated yield optimization',
            support: 'Enhanced support',
            color: 'blue',
          }
        default:
          return {
            fees: 'Standard fees',
            yield: 'Basic optimization',
            support: 'Community support',
            color: 'gray',
          }
      }
    }

    const benefits = getCardBenefits()

    return (
      <MerchantDashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Welcome back! Here's your payment gateway overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className={`${
                  merchantData.cardTier === 'Elite'
                    ? 'bg-purple-100 text-purple-700'
                    : merchantData.cardTier === 'Premium'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <RiTrophyLine className="w-4 h-4 mr-1" />
                MetaMask Card {merchantData.cardTier}
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Payments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockStats.totalPayments.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <RiExchangeLine className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Volume
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${mockStats.totalVolume.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <RiWallet3Line className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Monthly Growth
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    +{mockStats.monthlyGrowth}%
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <RiLineChartLine className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Yield Earned
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${mockStats.yieldEarned.toLocaleString()}
                  </p>
                  {merchantData.cardTier === 'Basic' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Upgrade for yield
                    </p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <RiTrophyLine className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions & Recent Transactions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Payment Widget</p>
                    <p className="text-sm text-gray-600">
                      Generate integration code
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={copyWidgetCode}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <RiCopyleftLine className="w-4 h-4 mr-1" />
                    Copy Code
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">
                      View Transactions
                    </p>
                    <p className="text-sm text-gray-600">
                      See all payment history
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <RiEyeLine className="w-4 h-4 mr-1" />
                    View All
                  </Button>
                </div>

                {(merchantData.cardTier === 'Premium' ||
                  merchantData.cardTier === 'Elite') && (
                  <div className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                    <div>
                      <p className="font-medium text-gray-900">
                        Yield Dashboard
                      </p>
                      <p className="text-sm text-gray-600">
                        Optimize DeFi returns
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <RiLineChartLine className="w-4 h-4 mr-1" />
                      Optimize
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Transactions
                </h3>
                <Button variant="ghost" size="sm">
                  View All <RiArrowRightLine className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {mockRecentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <RiWallet3Line className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          ${tx.amount}
                        </p>
                        <p className="text-sm text-gray-600">
                          {tx.from} • {tx.chain}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          tx.status === 'completed' ? 'default' : 'secondary'
                        }
                        className={
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {tx.status}
                      </Badge>
                      <p className="mt-1 text-xs text-gray-500">
                        {tx.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* MetaMask Card Benefits */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Your MetaMask Card Benefits
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="p-4 text-center rounded-lg bg-gray-50">
                <div className="mb-2 text-2xl font-bold text-orange-600">
                  {mockStats.avgTransactionTime}s
                </div>
                <p className="text-sm text-gray-600">Average Settlement Time</p>
              </div>
              <div className="p-4 text-center rounded-lg bg-gray-50">
                <div className="mb-2 text-2xl font-bold text-green-600">
                  {benefits.fees}
                </div>
                <p className="text-sm text-gray-600">Transaction Fees</p>
              </div>
              <div className="p-4 text-center rounded-lg bg-gray-50">
                <div className="mb-2 text-2xl font-bold text-blue-600">
                  {mockStats.successRate}%
                </div>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          </Card>
        </div>
      </MerchantDashboardLayout>
    )
  }

  // Fallback loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-orange-500 rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
