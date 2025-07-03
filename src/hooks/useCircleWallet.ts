'use client'

import { useState, useCallback } from 'react'

interface HatiWallet {
  id: string
  address: string
  blockchain: string
  walletType: 'merchant' | 'user'
  userId: string
  network: string
  createdAt: string
}

interface CircleWalletState {
  wallet: HatiWallet | null
  isLoading: boolean
  error: string | null
}

export const useCircleWallet = () => {
  const [state, setState] = useState<CircleWalletState>({
    wallet: null,
    isLoading: false,
    error: null,
  })

  // Create single Hati wallet on Linea
  const createWallet = useCallback(
    async (
      userId: string,
      walletType: 'merchant' | 'user',
      merchantAddress?: string,
    ): Promise<HatiWallet | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch('/api/circle/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createWallet',
            userId,
            walletType,
            merchantAddress,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error)
        }

        const wallet = result.data as HatiWallet

        setState((prev) => ({
          ...prev,
          wallet,
          isLoading: false,
        }))

        console.log(
          `✅ Created ${walletType} Hati wallet for ${userId}:`,
          wallet.address,
        )

        return wallet
      } catch (error: any) {
        console.error('Failed to create Hati wallet:', error)
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }))
        return null
      }
    },
    [],
  )

  // Get wallet balance
  const getWalletBalance = useCallback(async (walletId: string) => {
    try {
      const response = await fetch('/api/circle/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getBalance',
          walletId,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    } catch (error: any) {
      console.error('Failed to get wallet balance:', error)
      setState((prev) => ({ ...prev, error: error.message }))
      return null
    }
  }, [])

  // Sign transaction
  const signTransaction = useCallback(
    async (walletId: string, transaction: any) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch('/api/circle/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signTransaction',
            walletId,
            transaction,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error)
        }

        setState((prev) => ({ ...prev, isLoading: false }))
        return result.data
      } catch (error: any) {
        console.error('Failed to sign transaction:', error)
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }))
        return null
      }
    },
    [],
  )

  // Get wallet info
  const getWalletInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/circle/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getWalletInfo',
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    } catch (error: any) {
      console.error('Failed to get wallet info:', error)
      return null
    }
  }, [])

  // Clear wallet state
  const clearWallet = useCallback(() => {
    setState({
      wallet: null,
      isLoading: false,
      error: null,
    })
  }, [])

  return {
    // State
    wallet: state.wallet,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    createWallet,
    getWalletBalance,
    signTransaction,
    getWalletInfo,
    clearWallet,

    // Computed
    hasWallet: !!state.wallet,
    walletAddress: state.wallet?.address,
    walletId: state.wallet?.id,
  }
}
