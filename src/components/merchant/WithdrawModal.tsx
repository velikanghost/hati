'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCircleWallet } from '@/hooks/useCircleWallet'
import { toast } from 'sonner'
import { LoadingIcon } from '@/components/icons/loadingIcon'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  merchantAddress: string
  hatiWalletAddress: string
  hatiWalletId: string
}

export const WithdrawModal = ({
  isOpen,
  onClose,
  merchantAddress,
  hatiWalletId,
}: WithdrawModalProps) => {
  const [balance, setBalance] = useState<string>('0')
  const [amount, setAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  const { getWalletBalance } = useCircleWallet()

  // Fetch USDC balance when modal opens
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isOpen || !hatiWalletId) return

      setIsLoading(true)
      try {
        console.log('hatiWalletId', hatiWalletId)

        const response = await getWalletBalance(hatiWalletId)

        console.log('response', response)
        const formattedBalance = (
          parseFloat(response.totalUsdcBalance) / 1e6
        ).toFixed(2)

        setBalance(formattedBalance)
      } catch (error) {
        console.error('Failed to fetch balance:', error)
        toast.error('Failed to fetch balance')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [isOpen, hatiWalletId])

  // Poll for transaction status
  useEffect(() => {
    if (!transactionId) return

    const checkStatus = async () => {
      try {
        const response = await fetch('/api/circle/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getTransactionStatus',
            transactionId,
          }),
        })

        const data = await response.json()
        if (data.success) {
          if (data.data.state === 'COMPLETE') {
            toast.success('Withdrawal completed successfully!')
            setTransactionId(null)
            setIsWithdrawing(false)
            onClose()
          } else if (data.data.state === 'FAILED') {
            throw new Error('Transaction failed')
          }
        }
      } catch (error: any) {
        console.error('Transaction status check failed:', error)
        toast.error(error.message || 'Transaction failed')
        setTransactionId(null)
        setIsWithdrawing(false)
      }
    }

    const interval = setInterval(checkStatus, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [transactionId, onClose])

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      toast.error('Insufficient balance')
      return
    }

    setIsWithdrawing(true)
    try {
      const response = await fetch('/api/circle/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transferUsdc',
          walletId: hatiWalletId,
          destinationAddress: merchantAddress,
          amount: amount,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate transfer')
      }

      setTransactionId(data.data.id)
      toast.success('Transfer initiated! Please wait for confirmation...')
    } catch (error: any) {
      console.error('Withdrawal failed:', error)
      toast.error(error.message || 'Withdrawal failed')
      setIsWithdrawing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw USDC</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingIcon />
              <span className="ml-2">Loading balance...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2">
                <span className="text-sm text-gray-600">Available Balance</span>
                <span className="font-medium">
                  {parseFloat(balance).toFixed(2)} USDC
                </span>
              </div>

              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  max={balance}
                  step="0.01"
                  disabled={isWithdrawing}
                />

                <div className="flex justify-end">
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={() => setAmount(balance)}
                  >
                    Max
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleWithdraw}
                disabled={
                  isWithdrawing ||
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > parseFloat(balance)
                }
              >
                {isWithdrawing ? (
                  <>
                    <LoadingIcon />
                    {transactionId ? 'Processing...' : 'Withdrawing...'}
                  </>
                ) : (
                  'Withdraw'
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
