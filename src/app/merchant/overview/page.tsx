'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MerchantDashboardLayout from '@/components/layouts/merchantDashboard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { merchantStorage } from '@/lib/merchantStorage'
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

export default function MerchantOverview() {
  const router = useRouter()
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication and load merchant data
  useEffect(() => {
    loadMerchantData()
  }, [])

  const loadMerchantData = async () => {
    try {
      // First try to load from localStorage
      const cachedData = merchantStorage.load()
      if (cachedData) {
        console.log('Loading merchant data from cache')
        setMerchantData(cachedData)
        setIsLoading(false)
        return
      }

      // If no cached data, check wallet connection and fetch from API
      if (!window.ethereum) {
        router.push('/merchant')
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      })

      if (accounts.length === 0) {
        router.push('/merchant')
        return
      }

      const address = accounts[0]

      // Fetch from API if not in cache
      console.log('Fetching merchant data from API')
      const response = await fetch(
        `/api/hati/auth/merchant?address=${address}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        // No merchant profile found, redirect to onboarding
        router.push('/merchant')
        return
      }

      // Load and cache merchant data
      const userData = await response.json()
      const merchantData: MerchantData = {
        walletAddress: userData.walletAddress,
        hatiWalletAddress: userData.hatiWalletAddress,
        hatiWalletId: userData.hatiWalletId,
        cardTier: userData.cardTier,
        isNewUser: false,
      }

      // Save to localStorage for future use
      merchantStorage.save(merchantData)
      setMerchantData(merchantData)
    } catch (error) {
      console.error('Authentication check failed:', error)
      router.push('/merchant')
    } finally {
      setIsLoading(false)
    }
  }

  const copyWidgetCode = () => {
    if (!merchantData) return

    const widgetCode = `<script src="https://hati-payment.vercel.app/widget.js"></script>
<div id="hati-pay" 
     data-merchant="${merchantData.walletAddress}" 
     data-amount="100" 
     data-currency="USDC">
</div>`

    navigator.clipboard.writeText(widgetCode)
    // TODO: Add toast notification
  }

  const getCardBenefits = () => {
    if (!merchantData)
      return {
        fees: 'Standard fees',
        yield: 'Basic optimization',
        support: 'Community support',
        color: 'gray',
      }

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

  // Show loading state within dashboard layout
  if (isLoading) {
    return (
      <MerchantDashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-orange-500 rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </MerchantDashboardLayout>
    )
  }

  // Redirect if no merchant data (shouldn't reach here due to useEffect redirect)
  if (!merchantData) {
    return null
  }

  return (
    <MerchantDashboardLayout>
      <div className="flex flex-col h-full space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
            <p className="mt-1 text-gray-600">
              Welcome back! Here's your payment gateway overview.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                merchantData.cardTier === 'Elite'
                  ? 'bg-purple-500'
                  : merchantData.cardTier === 'Premium'
                  ? 'bg-blue-500'
                  : 'bg-gray-400'
              }`}
            ></div>
            <span className="text-sm font-medium text-gray-700">
              MetaMask Card {merchantData.cardTier}
            </span>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 transition-shadow bg-white border-0 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Payments
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {mockStats.totalPayments}
                </p>
                <p className="flex items-center mt-2 text-xs text-green-600">
                  ↗ +{mockStats.monthlyGrowth}% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <RiWallet3Line className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-shadow bg-white border-0 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Volume
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  ${mockStats.totalVolume.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-green-600">USDC</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <RiExchangeLine className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-shadow bg-white border-0 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Monthly Growth
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  +{mockStats.monthlyGrowth}%
                </p>
                <p className="mt-2 text-xs text-blue-600">vs last month</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <RiLineChartLine className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 transition-shadow bg-white border-0 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Yield Earned
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  ${mockStats.yieldEarned.toLocaleString()}
                </p>
                {(merchantData.cardTier === 'Premium' ||
                  merchantData.cardTier === 'Elite') && (
                  <p className="flex items-center mt-2 text-xs text-purple-600">
                    ✨ Auto-optimized
                  </p>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <RiTrophyLine className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid flex-1 min-h-0 grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card className="flex flex-col p-6 bg-white border-0 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between p-4 transition-colors rounded-xl bg-slate-50 hover:bg-slate-100">
                <div>
                  <p className="font-medium text-gray-900">Payment Widget</p>
                  <p className="text-sm text-gray-600">
                    Generate integration code
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={copyWidgetCode}
                  className="text-white bg-gray-900 hover:bg-gray-800"
                >
                  <RiCopyleftLine className="w-4 h-4 mr-1" />
                  Copy Code
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 transition-colors rounded-xl bg-slate-50 hover:bg-slate-100">
                <div>
                  <p className="font-medium text-gray-900">View Wallet</p>
                  <p className="text-sm text-gray-600">
                    See wallet details and balance
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/merchant/wallet')}
                  className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                >
                  <RiEyeLine className="w-4 h-4 mr-1" />
                  View Wallet
                </Button>
              </div>

              {(merchantData.cardTier === 'Premium' ||
                merchantData.cardTier === 'Elite') && (
                <div className="flex items-center justify-between p-4 transition-all border border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100">
                  <div>
                    <p className="font-medium text-gray-900">Yield Dashboard</p>
                    <p className="text-sm text-gray-600">
                      Optimize DeFi returns
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push('/merchant/yield')}
                    className="text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <RiLineChartLine className="w-4 h-4 mr-1" />
                    Optimize
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="flex flex-col p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Transactions
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                View All <RiArrowRightLine className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {mockRecentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 transition-colors rounded-xl bg-slate-50 hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <RiWallet3Line className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">${tx.amount}</p>
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
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }
                    >
                      {tx.status}
                    </Badge>
                    <p className="mt-1 text-xs text-gray-500">{tx.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* MetaMask Card Benefits */}
        <Card className="p-6 bg-white border-0 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Your MetaMask Card Benefits
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="p-4 text-center rounded-xl bg-slate-50">
              <div className="mb-1 text-2xl font-bold text-orange-600">
                {mockStats.avgTransactionTime}s
              </div>
              <p className="text-sm text-gray-600">Average Settlement Time</p>
            </div>
            <div className="p-4 text-center rounded-xl bg-slate-50">
              <div className="mb-1 text-2xl font-bold text-green-600">
                {benefits.fees}
              </div>
              <p className="text-sm text-gray-600">Transaction Fees</p>
            </div>
            <div className="p-4 text-center rounded-xl bg-slate-50">
              <div className="mb-1 text-2xl font-bold text-blue-600">
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
