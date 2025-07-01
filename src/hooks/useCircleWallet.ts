'use client'

import { useState, useCallback } from 'react'

interface HatiWallet {
  id: string
  address: string
  blockchain: string
  state: 'LIVE' | 'FROZEN'
  walletSetId: string
  createDate: string
  updateDate: string
}

interface WalletBalance {
  token: {
    symbol: string
    address: string
  }
  amount: string
}

export const useCircleWallet = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<HatiWallet | null>(null)
  const [balance, setBalance] = useState<WalletBalance[]>([])

  const createWallet = useCallback(
    async (userId: string, blockchain: 'ETH' | 'MATIC' | 'AVAX' = 'ETH') => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/circle/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'createWallet',
            userId,
            blockchain,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to create wallet')
        }

        setWallet(result.data)
        return result.data
      } catch (err: any) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const getWalletBalance = useCallback(async (walletId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/circle/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getBalance',
          walletId,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get balance')
      }

      setBalance(result.data)
      return result.data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getUSDCBalance = useCallback(
    (balances: WalletBalance[] = balance) => {
      const usdcBalance = balances.find(
        (b) =>
          b.token.symbol.toUpperCase() === 'USDC' ||
          b.token.symbol.toUpperCase() === 'USDC.E',
      )
      return usdcBalance ? parseFloat(usdcBalance.amount) : 0
    },
    [balance],
  )

  const resetState = useCallback(() => {
    setWallet(null)
    setBalance([])
    setError(null)
    setLoading(false)
  }, [])

  return {
    // State
    loading,
    error,
    wallet,
    balance,

    // Actions
    createWallet,
    getWalletBalance,
    getUSDCBalance,
    resetState,
  }
}
