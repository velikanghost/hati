'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { useCircleWallet } from '@/hooks'
import { toast } from 'sonner'
import { LoadingIcon } from './icons/loadingIcon'

interface HatiWalletManagerProps {
  userType: 'user' | 'merchant'
  userId: string
  onWalletReady?: (walletAddress: string) => void
  showPaymentOptions?: boolean
}

export const HatiWalletManager: React.FC<HatiWalletManagerProps> = ({
  userType,
  userId,
  onWalletReady,
}) => {
  const { createWallet, wallet, loading, error } = useCircleWallet()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateWallet = async () => {
    setIsCreating(true)
    try {
      const newWallet = await createWallet(userId, 'ETH')
      toast.success('Hati wallet created successfully!')
      if (onWalletReady) {
        onWalletReady(newWallet.address)
      }
    } catch (err: any) {
      toast.error(`Failed to create Hati wallet: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  if (wallet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Hati Wallet Connected</CardTitle>
          <CardDescription>
            Your Circle developer-controlled wallet is ready
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Address:</strong> {wallet.address.substring(0, 10)}...
            </p>
            <p className="text-sm">
              <strong>Blockchain:</strong> {wallet.blockchain}
            </p>
            <p className="text-sm text-green-600">
              <strong>Status:</strong> {wallet.state}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Create Your Hati Wallet</CardTitle>
        <CardDescription>
          {userType === 'merchant'
            ? 'Create a wallet to receive payments with automatic yield generation'
            : 'Create your personal wallet to earn yield on deposits'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <h4 className="mb-2 text-sm font-semibold">
            🚀 Circle Developer Wallets
          </h4>
          <p className="text-sm text-gray-600">
            Powered by Circle's infrastructure for secure, programmable wallets
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleCreateWallet}
          disabled={isCreating || loading}
          className="w-full"
        >
          {isCreating || loading ? (
            <>
              <LoadingIcon />
              Creating Wallet...
            </>
          ) : (
            'Create Hati Wallet'
          )}
        </Button>
        {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
      </CardFooter>
    </Card>
  )
}

export default HatiWalletManager
