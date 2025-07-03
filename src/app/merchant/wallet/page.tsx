'use client'

import React, { useState, useEffect } from 'react'
import {
  RiEyeLine,
  RiEyeOffLine,
  RiRefreshLine,
  RiCopyleftLine,
  RiExternalLinkLine,
  RiShieldCheckLine,
  RiWallet3Line,
} from 'react-icons/ri'
import { HiOutlineDocumentDuplicate } from 'react-icons/hi'
import MerchantDashboardLayout from '@/components/layouts/merchantDashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { merchantStorage } from '@/lib/merchantStorage'
import { WithdrawModal } from '@/components/merchant/WithdrawModal'
import { LoadingIcon } from '@/components/icons/loadingIcon'

interface WalletData {
  walletAddress: string
  hatiWalletAddress: string
  hatiWalletId: string
  cardTier: 'Basic' | 'Premium' | 'Elite'
  balance: string
  network: {
    receive: string
    withdraw: string
  }
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  // Fetch real wallet data from API using existing auth pattern
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        // First try to load merchant data from localStorage (same as overview page)
        const cachedMerchantData = merchantStorage.load()
        if (cachedMerchantData && cachedMerchantData.hatiWalletId) {
          // We have cached data with wallet ID, fetch balance from Moralis
          console.log('Loading wallet data from cached merchant profile')

          const moralisResponse = await fetch(
            `/api/moralis/tokens?address=${cachedMerchantData.hatiWalletAddress}&chain=optimism`,
          )

          if (moralisResponse.ok) {
            const moralisData = await moralisResponse.json()
            if (moralisData.success) {
              const usdcToken = moralisData.result.find(
                (t: any) =>
                  t.token_address.toLowerCase() ===
                  '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'.toLowerCase(),
              )

              // Format balance considering decimals
              const formattedBalance = usdcToken
                ? (
                    parseFloat(usdcToken.balance) /
                    Math.pow(10, usdcToken.decimals)
                  ).toFixed(2)
                : '0.00'

              setWalletData({
                walletAddress: cachedMerchantData.walletAddress,
                hatiWalletAddress: cachedMerchantData.hatiWalletAddress || '',
                hatiWalletId: cachedMerchantData.hatiWalletId,
                cardTier: cachedMerchantData.cardTier,
                balance: formattedBalance,
                network: {
                  receive: 'Optimism',
                  withdraw: 'Linea',
                },
              })
              setIsLoading(false)
              return
            }
          }
        }

        // Fallback: Check wallet connection and fetch from API (same as overview page)
        if (!window.ethereum) {
          throw new Error('MetaMask not found. Please install MetaMask.')
        }

        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })

        if (accounts.length === 0) {
          throw new Error('No wallet connected. Please connect your wallet.')
        }

        const address = accounts[0]

        // Fetch merchant profile from API
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
          throw new Error(
            'Merchant profile not found. Please complete onboarding.',
          )
        }

        const userData = await response.json()

        // Fetch balance using Moralis
        let balance = '0.00'
        if (userData.hatiWalletAddress) {
          try {
            const moralisResponse = await fetch(
              `/api/moralis/tokens?address=${userData.hatiWalletAddress}&chain=optimism`,
            )
            if (moralisResponse.ok) {
              const moralisData = await moralisResponse.json()
              if (moralisData.success) {
                const usdcToken = moralisData.result.find(
                  (t: any) =>
                    t.token_address.toLowerCase() ===
                    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'.toLowerCase(),
                )
                // Format balance considering decimals
                balance = usdcToken
                  ? (
                      parseFloat(usdcToken.balance) /
                      Math.pow(10, usdcToken.decimals)
                    ).toFixed(2)
                  : '0.00'
              }
            }
          } catch (balanceError) {
            console.warn('Failed to fetch balance:', balanceError)
          }
        }

        // Map card tier and save to cache
        const merchantData = {
          walletAddress: userData.walletAddress,
          hatiWalletAddress: userData.hatiWalletAddress,
          hatiWalletId: userData.hatiWalletId,
          cardTier: userData.cardTier,
          isNewUser: false,
        }
        merchantStorage.save(merchantData)

        setWalletData({
          walletAddress: userData.walletAddress,
          hatiWalletAddress: userData.hatiWalletAddress,
          hatiWalletId: userData.hatiWalletId,
          cardTier: userData.cardTier,
          balance: balance,
          network: {
            receive: 'Optimism',
            withdraw: 'Linea',
          },
        })

        setIsLoading(false)
      } catch (error: any) {
        console.error('Failed to fetch wallet data:', error)
        toast.error(error.message || 'Failed to load wallet data')
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
      if (!walletData?.hatiWalletAddress) {
        throw new Error('No wallet address found')
      }

      // Force refresh balance from Moralis API
      const response = await fetch(
        `/api/moralis/tokens?address=${walletData.hatiWalletAddress}&chain=optimism`,
      )

      if (!response.ok) {
        throw new Error('Failed to refresh balance')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Balance refresh failed')
      }

      const usdcToken = result.result.find(
        (t: any) =>
          t.token_address.toLowerCase() ===
          '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'.toLowerCase(),
      )

      // Format balance considering decimals
      const formattedBalance = usdcToken
        ? (
            parseFloat(usdcToken.balance) / Math.pow(10, usdcToken.decimals)
          ).toFixed(2)
        : '0.00'

      // Update wallet data with new balance
      setWalletData({
        ...walletData,
        balance: formattedBalance,
      })

      toast.success('Balance refreshed!', {
        duration: 2000,
        position: 'top-center',
      })
    } catch (error: any) {
      console.error('Balance refresh error:', error)
      toast.error(error.message || 'Failed to refresh balance')
    } finally {
      setIsRefreshing(false)
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
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingIcon />
          <span className="ml-2">Loading wallet data...</span>
        </div>
      </MerchantDashboardLayout>
    )
  }

  if (!walletData) {
    return (
      <MerchantDashboardLayout>
        <div className="text-center">
          <p>No wallet data found. Please connect your wallet.</p>
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
        <Card className="overflow-hidden bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle>Wallet Overview</CardTitle>
              <Badge
                variant="outline"
                className={`px-3 py-1 text-${benefits.color}-600 bg-${benefits.color}-50 border-${benefits.color}-200`}
              >
                {walletData.cardTier} Tier
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Balance Section */}
              <div
                className="p-6 rounded-lg"
                style={{ backgroundColor: '#F1F6FC' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Available Balance
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Receive on {walletData.network.receive}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      Withdraw to {walletData.network.withdraw}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: '#1D1D22' }}
                  >
                    ${walletData.balance} USDC
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>

                <Button
                  onClick={() => setShowWithdrawModal(true)}
                  className="mt-4 w-full bg-[#0B263F] text-white hover:bg-[#0B263F]/90"
                  disabled={parseFloat(walletData.balance) <= 0}
                >
                  <RiWallet3Line className="w-4 h-4 mr-2" />
                  Withdraw to MetaMask
                </Button>
              </div>

              {/* Wallet Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Hati Wallet Address
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code
                      className="flex-1 p-2 text-sm rounded bg-gray-50"
                      style={{ color: '#1D1D22' }}
                    >
                      {walletData.hatiWalletAddress}
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
                    Connected MetaMask
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code
                      className="flex-1 p-2 text-sm rounded bg-gray-50"
                      style={{ color: '#1D1D22' }}
                    >
                      {walletData.walletAddress}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopyAddress(
                          walletData.walletAddress,
                          'MetaMask address',
                        )
                      }
                    >
                      <RiCopyleftLine className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Card Benefits
                  </label>
                  <div className="mt-2 space-y-2">
                    {benefits.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded bg-gray-50"
                      >
                        <RiShieldCheckLine className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        merchantAddress={walletData?.walletAddress || ''}
        hatiWalletAddress={walletData?.hatiWalletAddress || ''}
        hatiWalletId={walletData?.hatiWalletId || ''}
      />
    </MerchantDashboardLayout>
  )
}
