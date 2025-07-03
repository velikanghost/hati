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
import { useLiFiBridge } from '@/hooks/useLiFiBridge'
import { toast } from 'sonner'
import { LoadingIcon } from '@/components/icons/loadingIcon'

const LINEA_USDC = '0x176211869Ca2B568f2A7D4EE941E073a821EE1ff'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  merchantAddress: string
  hatiWalletAddress: string
}

export const WithdrawModal = ({
  isOpen,
  onClose,
  merchantAddress,
  hatiWalletAddress,
}: WithdrawModalProps) => {
  const [balance, setBalance] = useState<string>('0')
  const [amount, setAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const { executePayment } = useLiFiBridge()

  // Fetch USDC balance using Moralis when modal opens
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isOpen || !hatiWalletAddress) return

      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/moralis/tokens?address=${hatiWalletAddress}&chain=linea`,
        )
        const data = await response.json()

        if (data.success) {
          const usdcToken = data.tokens.find(
            (t: any) =>
              t.token_address.toLowerCase() === LINEA_USDC.toLowerCase(),
          )
          setBalance(usdcToken?.amount_formatted || '0')
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error)
        toast.error('Failed to fetch balance')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [isOpen, hatiWalletAddress])

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
      // Get route from LiFi
      const route = await fetch('/api/lifi/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromChain: 59144, // Linea
          toChain: 59144, // Linea (same chain transfer)
          fromToken: LINEA_USDC,
          toToken: LINEA_USDC,
          fromAmount: amount,
          fromAddress: hatiWalletAddress,
          toAddress: merchantAddress,
        }),
      }).then((r) => r.json())

      if (!route?.bestRoute) {
        throw new Error('No route found')
      }

      // Execute the withdrawal
      const result = await executePayment(route.bestRoute, {
        onProgress: (route) => {
          console.log(
            'Withdrawal progress:',
            route.steps.map((step) => ({
              status: step.execution?.status,
              txHash: step.execution?.process?.find((p) => p.txHash)?.txHash,
            })),
          )
        },
        onSuccess: (result) => {
          toast.success('Withdrawal completed successfully!')
          onClose()
        },
        onError: (error) => {
          toast.error(`Withdrawal failed: ${error}`)
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Withdrawal failed')
      }
    } catch (error: any) {
      console.error('Withdrawal failed:', error)
      toast.error(error.message || 'Withdrawal failed')
    } finally {
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
                    <span className="ml-2">Withdrawing...</span>
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
