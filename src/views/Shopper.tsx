import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setUserEvmAddress } from '@/store/slices/connectSlice'
import { useMetaMask } from '@/hooks'
import { useEffect, useCallback, useRef, useState } from 'react'
import Navbar from '@/components/layouts/navbar'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, Wallet, Shield, Store } from 'lucide-react'

const Shopper = () => {
  const dispatch = useAppDispatch()
  const { userEvmAccount, cardTier } = useAppSelector((state) => state.connect)

  const hasCheckedInitialConnection = useRef(false)
  const [amount, setAmount] = useState('5')
  const [showChainSelector, setShowChainSelector] = useState(false)

  const { connectWallet, account } = useMetaMask()

  // Mock merchant details for demo
  const merchantName = 'Hati'
  const merchantAddress = '0x0cf7.....7842ce'

  const getAccount = useCallback(async () => {
    try {
      const result = await connectWallet()
      dispatch(setUserEvmAddress(result?.address || ''))

      console.log('Wallet connected:', result)
    } catch (error: any) {
      toast.error(error?.message || error || 'Failed to connect wallet', {
        duration: 3000,
        position: 'top-center',
      })
    }
  }, [connectWallet, dispatch])

  useEffect(() => {
    const checkExistingConnection = async () => {
      if (
        account?.address &&
        !userEvmAccount.address &&
        !hasCheckedInitialConnection.current
      ) {
        hasCheckedInitialConnection.current = true
        try {
          dispatch(setUserEvmAddress(account.address))
          console.log('Existing SDK connection found:', account)
        } catch (error: any) {
          toast.error(
            error?.message || error || 'Failed to restore connection',
            {
              duration: 3000,
              position: 'top-center',
            },
          )
        }
      }
    }

    checkExistingConnection()
  }, [account?.address, dispatch, userEvmAccount.address])

  const beginTransfer = async () => {
    if (!userEvmAccount.address) {
      toast.error('Connect wallet first!', {
        duration: 1100,
        position: 'top-center',
      })
      return
    }

    try {
      toast.success('Payment completed successfully!', {
        duration: 3000,
        position: 'top-center',
      })
    } catch (error: any) {
      toast.error(error?.message || error || 'Transfer failed', {
        duration: 3000,
        position: 'top-center',
      })
    }
  }

  const getFeeReduction = () => {
    if (!cardTier?.hasCard) return 0
    switch (cardTier.tier) {
      case 'elite':
        return 100 // 0% fees (100% reduction)
      case 'premium':
        return 50 // 50% reduction
      case 'basic':
        return 10 // 10% reduction
      default:
        return 0
    }
  }

  const feeReduction = getFeeReduction()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFD28F]/20 via-[#F1A5FB]/10 to-[#0B263F]/5">
      <Navbar />

      <div className="container px-4 py-12 mx-auto">
        <div className="max-w-lg mx-auto">
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl">
            <CardContent className="p-8">
              <h1 className="text-2xl font-bold text-[#0B263F]">
                Checkout with Hati
              </h1>

              {/* Payment Details Section */}
              <div className="mb-8">
                <Card className="border border-gray-200 bg-gray-50 rounded-2xl">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0B263F] rounded-full flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0B263F]">
                          {merchantName}
                        </p>
                        <p className="font-mono text-xs text-gray-500">
                          {merchantAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-4xl font-bold text-[#0B263F]">
                        ${amount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-8">
                <Card className="bg-[#0B263F] text-white border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Wallet className="w-5 h-5" />
                      <p className="font-semibold">You pay with</p>
                    </div>
                    <Button
                      variant="ghost"
                      className="justify-between w-full h-auto p-4 text-white border hover:bg-white/10 rounded-xl border-white/20"
                      onClick={() => setShowChainSelector(!showChainSelector)}
                    >
                      <span className="text-lg font-medium">
                        Select chain/token
                      </span>
                      <ChevronDown size={20} />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Connect Wallet / Pay Button */}
              <Button
                className="w-full bg-[#0B263F] hover:bg-[#0B263F]/90 text-white py-4 font-bold text-lg rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                onClick={userEvmAccount.address ? beginTransfer : getAccount}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5" />
                  {userEvmAccount.address
                    ? 'Complete Payment'
                    : 'Connect Wallet'}
                </div>
              </Button>

              {/* Connected Wallet Info */}
              {userEvmAccount.address && (
                <div className="p-4 mt-6 border border-green-200 bg-green-50 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-green-700">
                      Wallet Connected
                    </p>
                  </div>
                  <p className="font-mono text-sm text-green-600">
                    {userEvmAccount.address.slice(0, 6)}...
                    {userEvmAccount.address.slice(-4)}
                  </p>
                  {cardTier?.hasCard && (
                    <div className="p-3 mt-3 bg-white border border-green-100 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#0B263F]" />
                        <p className="text-sm font-semibold text-[#0B263F]">
                          MetaMask Card ({cardTier.tier.toUpperCase()})
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {feeReduction}% fee reduction applied
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Shopper
