'use client'

import { useState, useEffect } from 'react'
import MerchantDashboardLayout from '@/components/layouts/merchantDashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RiWallet3Line,
  RiExternalLinkLine,
  RiCopyleftLine,
  RiEyeLine,
  RiEyeOffLine,
  RiRefreshLine,
  RiShieldCheckLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

interface WalletData {
  walletAddress: string
  hatiWalletAddress: string
  hatiWalletId: string
  cardTier: 'Basic' | 'Premium' | 'Elite'
  balance: string
  network: string
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mock data for demo - in production, fetch from API
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          setWalletData({
            walletAddress: '0x2cab74bdb5c0eb9e63a03bc9d448a92a201d7c88',
            hatiWalletAddress: '0x9876543210123456789012345678901234567890',
            hatiWalletId: '4272fcb5-4593-5b41-b81a-2a9f7c813bb9',
            cardTier: 'Premium',
            balance: '1,234.56',
            network: 'Linea',
          })
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Failed to fetch wallet data:', error)
        setIsLoading(false)
      }
    }

    fetchWalletData()
  }, [])

  const handleCopyAddress = (address: string, type: string) => {
    navigator.clipboard.writeText(address)
    toast.success(`${type} address copied!`, {
      duration: 2000,
      position: 'top-center',
    })
  }

  const refreshBalance = async () => {
    setIsRefreshing(true)
    try {
      // Simulate balance refresh
      setTimeout(() => {
        if (walletData) {
          setWalletData({
            ...walletData,
            balance: (Math.random() * 2000 + 500).toFixed(2),
          })
        }
        setIsRefreshing(false)
        toast.success('Balance refreshed!', {
          duration: 2000,
          position: 'top-center',
        })
      }, 1500)
    } catch (error) {
      setIsRefreshing(false)
      toast.error('Failed to refresh balance')
    }
  }

  const getCardBenefits = () => {
    if (!walletData) return { color: 'gray', benefits: [] }

    switch (walletData.cardTier) {
      case 'Elite':
        return {
          color: 'purple',
          benefits: [
            '0% transaction fees',
            'Advanced yield strategies',
            'Priority support',
          ],
        }
      case 'Premium':
        return {
          color: 'blue',
          benefits: [
            '50% reduced fees',
            'Automated yield optimization',
            'Enhanced support',
          ],
        }
      default:
        return {
          color: 'gray',
          benefits: [
            'Standard fees',
            'Basic optimization',
            'Community support',
          ],
        }
    }
  }

  if (isLoading) {
    return (
      <MerchantDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-b-2 rounded-full animate-spin border-[#0B263F]"></div>
            <p style={{ color: '#1D1D22' }}>Loading wallet information...</p>
          </div>
        </div>
      </MerchantDashboardLayout>
    )
  }

  if (!walletData) {
    return (
      <MerchantDashboardLayout>
        <div className="p-6">
          <Card className="p-8 text-center">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: '#1D1D22' }}
            >
              No Wallet Found
            </h2>
            <p className="mb-6 text-gray-600">
              Unable to load wallet information. Please try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              style={{ backgroundColor: '#0B263F' }}
              className="text-white hover:opacity-90"
            >
              Retry
            </Button>
          </Card>
        </div>
      </MerchantDashboardLayout>
    )
  }

  const benefits = getCardBenefits()

  return (
    <MerchantDashboardLayout>
      <div className="h-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#1D1D22' }}>
              Wallet
            </h1>
            <p className="mt-1 text-gray-600">
              Manage your Hati wallet and view transaction history
            </p>
          </div>
          <Button
            onClick={refreshBalance}
            disabled={isRefreshing}
            variant="outline"
            className="border-[#0B263F] text-[#0B263F] hover:bg-[#0B263F] hover:text-white"
          >
            <RiRefreshLine
              className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Hati Wallet */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: '#1D1D22' }}
              >
                Hati Wallet
              </h3>
              <Badge
                className={`${
                  benefits.color === 'purple'
                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                    : benefits.color === 'blue'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {walletData.cardTier} Tier
              </Badge>
            </div>

            <div className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: '#F1F6FC' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Balance
                  </span>
                  <span className="text-sm text-gray-500">
                    {walletData.network}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: '#1D1D22' }}
                  >
                    ${walletData.balance} USDC
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Wallet Address
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code
                      className="flex-1 p-2 text-sm rounded bg-gray-50"
                      style={{ color: '#1D1D22' }}
                    >
                      {walletData.hatiWalletAddress.slice(0, 20)}...
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopyAddress(
                          walletData.hatiWalletAddress,
                          'Hati wallet',
                        )
                      }
                    >
                      <RiCopyleftLine className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Wallet ID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code
                      className="flex-1 p-2 text-sm rounded bg-gray-50"
                      style={{ color: '#1D1D22' }}
                    >
                      {walletData.hatiWalletId}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopyAddress(walletData.hatiWalletId, 'Wallet ID')
                      }
                    >
                      <RiCopyleftLine className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* MetaMask Connection */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: '#1D1D22' }}
              >
                MetaMask Connection
              </h3>
              <RiShieldCheckLine className="w-5 h-5 text-green-500" />
            </div>

            <div className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: '#F1F6FC' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Connected Address
                  </span>
                  <span className="text-sm text-green-600">Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm" style={{ color: '#1D1D22' }}>
                    {walletData.walletAddress.slice(0, 20)}...
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopyAddress(walletData.walletAddress, 'MetaMask')
                    }
                  >
                    <RiCopyleftLine className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium" style={{ color: '#1D1D22' }}>
                  Card Benefits Active:
                </h4>
                <ul className="space-y-1">
                  {benefits.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="p-6 bg-white border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#1D1D22' }}>
              Recent Transactions
            </h3>
            <Button variant="outline" size="sm">
              View All <RiExternalLinkLine className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="py-8 text-center">
            <RiWallet3Line className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No transactions yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Transactions will appear here once you start receiving payments
            </p>
          </div>
        </Card>

        {/* Circle Branding Footer */}
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">
            🔐 Powered by{' '}
            <a
              href="https://circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#0B263F] hover:underline"
            >
              Circle
            </a>{' '}
            Developer Controlled Wallets
          </p>
        </div>
      </div>
    </MerchantDashboardLayout>
  )
}
