import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setUserEvmAddress } from '@/store/slices/connectSlice'
import { useMetaMask } from '@/hooks'
import { useLiFiBridge } from '@/hooks/useLiFiBridge'
import { useEffect, useCallback, useRef, useState } from 'react'
import Navbar from '@/components/layouts/navbar'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, Wallet, Shield, Store } from 'lucide-react'
import { useTokenBalances, TokenBalance } from '@/hooks/useTokenBalances'
import { TokenSelectModal } from '@/components/tokenSelectModal'
import SetMerchant from '@/components/setMerchant'
import { Tab } from '@/lib/types/all'

// Mapping Moralis chain names to numeric chain IDs used by LiFi
const CHAIN_NAME_TO_ID: Record<string, number> = {
  Ethereum: 1,
  'Ethereum Mainnet': 1,
  Arbitrum: 42161,
  Optimism: 10,
  Base: 8453,
  Linea: 59144,
}
const LINEA_USDC = '0x176211869Ca2B568f2A7D4EE941E073a821EE1ff'

const Shopper = () => {
  const dispatch = useAppDispatch()
  const { userEvmAccount, cardTier, merchantAmount, merchantId } =
    useAppSelector((state) => state.connect)

  const hasCheckedInitialConnection = useRef(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)
  const [activeTabState, setActiveTabState] = useState<Tab>('DEFAULT')

  const { connectWallet, account } = useMetaMask()
  const { executePayment, isExecuting, executionResult, sdkConfigured } =
    useLiFiBridge()

  const merchantName = 'Hati'

  const getAccount = useCallback(async () => {
    try {
      console.log('🔄 Connecting wallet...')
      const result = await connectWallet()
      dispatch(setUserEvmAddress(result?.address || ''))

      console.log('✅ Wallet connected:', {
        address: result?.address,
        hasProvider: !!result?.provider,
      })
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error)
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
    console.log('🔄 Beginning transfer with state:', {
      hasWallet: !!userEvmAccount.address,
      hasToken: !!selectedToken,
      sdkConfigured,
    })

    if (!userEvmAccount.address) {
      console.warn('⚠️ No wallet connected')
      toast.error('Connect wallet first!', {
        duration: 1100,
        position: 'top-center',
      })
      return
    }

    if (!selectedToken) {
      console.warn('⚠️ No token selected')
      toast('Select a token first!', { duration: 2000, position: 'top-center' })
      return
    }

    if (!sdkConfigured) {
      console.error('❌ LiFi SDK not configured')
      toast.error('LiFi SDK not configured. Please refresh and try again.')
      return
    }

    try {
      const symbolToId: Record<string, string> = {
        ETH: 'ethereum',
        USDC: 'usd-coin',
        USDT: 'tether',
        BNB: 'binancecoin',
        POL: 'matic-network',
      }
      const coingeckoId = symbolToId[selectedToken.symbol.toUpperCase()] || ''
      let tokenPrice = 0
      if (coingeckoId) {
        const priceRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
        )
        const priceJson = await priceRes.json()
        tokenPrice = priceJson[coingeckoId]?.usd || 0
      }
      const amountUsd = merchantAmount || 0
      const tokenEquivalent = tokenPrice ? amountUsd / tokenPrice : 0

      const network = selectedToken.chain || 'unknown'

      // ------------------------------------------------------------------
      // 1. Fetch merchant profile to obtain destination Hati wallet address
      // ------------------------------------------------------------------
      const profileRes = await fetch(`/api/hati/merchant/${merchantId}`)
      if (!profileRes.ok) {
        toast.error('Merchant not found')
        return
      }
      const { data: merchantProfile } = await profileRes.json()
      const destinationAddress = merchantProfile.hatiWalletAddress

      // ------------------------------------------------------------------
      // 2. Build LiFi request to get routes (source → Linea USDC)
      // ------------------------------------------------------------------
      const fromChainId = CHAIN_NAME_TO_ID[network] || 1
      const decimals = selectedToken.decimals || 18
      const rawAmount = BigInt(
        Math.floor(tokenEquivalent * 10 ** decimals),
      ).toString()

      const routeRequestBody = {
        action: 'getRoutes',
        fromChainId,
        toChainId: 59144, // Linea mainnet
        fromTokenAddress: selectedToken.token_address,
        toTokenAddress: LINEA_USDC,
        fromAmount: rawAmount,
        fromAddress: userEvmAccount.address,
        toAddress: destinationAddress,
      }

      const routeRes = await fetch('/api/lifi/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeRequestBody),
      })
      const routeJson = await routeRes.json()
      if (!routeJson.success) {
        toast.error(routeJson.error || 'Failed to get bridge routes')
        return
      }

      const bestRoute = routeJson.data.bestRoute

      // ------------------------------------------------------------------
      // 3. Execute bridge using real LiFi SDK
      // ------------------------------------------------------------------
      toast('Executing payment with LiFi...', { duration: 2000 })

      const result = await executePayment(bestRoute, {
        onProgress: (route) => {
          console.log(
            'Payment progress:',
            route.steps.map((step) => ({
              status: step.execution?.status,
              txHash: step.execution?.process?.find((p) => p.txHash)?.txHash,
            })),
          )
        },
        onSuccess: (result) => {
          toast.success('Payment completed successfully!')
          console.log('Payment completed:', result)
        },
        onError: (error) => {
          toast.error(`Payment failed: ${error}`)
          console.error('Payment error:', error)
        },
      })

      if (result.success) {
        console.log('Payment summary:', {
          merchantId,
          merchantAmount: amountUsd,
          token: selectedToken.symbol,
          network,
          tokenEquivalent,
          destinationAddress,
          txHash: result.txHash,
        })
      }
    } catch (e) {
      console.error('Price fetch failed', e)
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

  // Fetch token balances after wallet is connected
  const {
    balances,
    isLoading: balancesLoading,
    error: balancesError,
  } = useTokenBalances(userEvmAccount.address, {
    enabled: Boolean(userEvmAccount.address),
  })

  // For now, just log balances to the console so we can verify
  useEffect(() => {
    if (userEvmAccount.address && !balancesLoading && !balancesError) {
      console.log('Token balances:', balances)
    }
  }, [userEvmAccount.address, balances, balancesLoading, balancesError])

  const handleSelectToken = (token: TokenBalance) => {
    setSelectedToken(token)
    setShowTokenModal(false)
  }

  // wrapper to satisfy Tab type
  const setActiveTab = (val: Tab) => setActiveTabState(val)

  if (activeTabState === 'SET_MERCHANT') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFD28F]/20 via-[#F1A5FB]/10 to-[#0B263F]/5">
        <Navbar />
        <div className="container max-w-lg px-4 py-12 mx-auto">
          <Card className="relative p-6 overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl">
            <SetMerchant setActiveTab={setActiveTab} />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFD28F]/20 via-[#F1A5FB]/10 to-[#0B263F]/5">
      <Navbar />

      <div className="container px-4 py-12 mx-auto">
        <div className="max-w-lg mx-auto">
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#0B263F]">
                  Checkout with Hati
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('SET_MERCHANT')}
                >
                  Set Merchant
                </Button>
              </div>

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
                          {merchantId}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-4xl font-bold text-[#0B263F]">
                        ${merchantAmount}
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
                      onClick={() => setShowTokenModal(true)}
                    >
                      <span className="text-lg font-medium">
                        {selectedToken ? selectedToken.symbol : 'Select token'}
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
                disabled={isExecuting}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5" />
                  {isExecuting
                    ? 'Processing Payment...'
                    : userEvmAccount.address
                    ? 'Complete Payment'
                    : 'Connect Wallet'}
                </div>
              </Button>

              {/* Execution Progress */}
              {isExecuting && (
                <div className="p-4 mt-4 border border-blue-200 bg-blue-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-blue-700">
                      Processing Payment
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-blue-600">
                    Please confirm any wallet prompts and wait for completion...
                  </p>
                </div>
              )}

              {/* Execution Result */}
              {executionResult && !isExecuting && (
                <div
                  className={`mt-4 p-4 border rounded-2xl ${
                    executionResult.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        executionResult.success ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <p
                      className={`text-sm font-semibold ${
                        executionResult.success
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {executionResult.success
                        ? 'Payment Successful'
                        : 'Payment Failed'}
                    </p>
                  </div>
                  {executionResult.txHash && (
                    <p className="mt-1 font-mono text-xs text-gray-600">
                      Tx: {executionResult.txHash.slice(0, 10)}...
                      {executionResult.txHash.slice(-8)}
                    </p>
                  )}
                  {executionResult.error && (
                    <p className="mt-1 text-xs text-red-600">
                      {executionResult.error}
                    </p>
                  )}
                </div>
              )}

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

              {/* Token Select Modal */}
              <TokenSelectModal
                isOpen={showTokenModal}
                onClose={() => setShowTokenModal(false)}
                tokens={balances}
                onSelect={handleSelectToken}
                loading={balancesLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Shopper
