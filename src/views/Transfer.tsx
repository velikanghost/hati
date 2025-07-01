import { Button } from '@/components/ui/button'
import { tokens } from '@/lib/data'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  setUserEvmAddress,
  disconnectWallet,
} from '@/store/slices/connectSlice'
import { setBridgeComplete } from '@/store/slices/bridgeSlice'
import { useMetaMask } from '@/hooks'
import { useLiFiBridge } from '@/hooks/useLiFiBridge'
import { useEffect, useState, useCallback } from 'react'
import { LoadingIcon } from '@/components/icons/loadingIcon'
import SelectToken from '@/components/selectToken'
import { Token } from '@/lib/types/token'
import Navbar from '@/components/layouts/navbar'
import MerchantLayer from '@/components/merchantLayer'
import UserLayer from '@/components/userLayer'
import CardVerification from '@/components/cardVerification'
import Link from 'next/link'
import { MdArrowOutward } from 'react-icons/md'
import { Tab } from '@/lib/types/all'
import SetMerchant from '@/components/setMerchant'
import { toast } from 'sonner'

const Transfer = () => {
  const dispatch = useAppDispatch()
  const {
    transferAmount,
    merchantAmount,
    merchantAddress,
    selectedChain,
    selectedToken,
    ethPrice,
    userEvmAccount,
    cardTier,
    isVerifyingCard,
  } = useAppSelector((state) => state.connect)

  const [activeTab, setActiveTab] = useState<Tab>('DEFAULT')
  const [userToken, setUserToken] = useState<Token>()

  const merchantToken = tokens[2]
  const chain = 'Arbitrum Sepolia'

  const { connectWallet, account, isConnecting, disconnect } = useMetaMask()

  // Bridge functionality
  const {
    loading,
    bridgeComplete,
    currentTxHash: transactionHash,
  } = useLiFiBridge()

  // Enhanced wallet connection with MetaMask SDK and Card verification
  const getAccount = useCallback(async () => {
    try {
      const result = await connectWallet()
      // Set account from MetaMask connection
      dispatch(setUserEvmAddress(result?.address || ''))

      console.log(result)
      console.log(account)
      // if (result.cardTier?.hasCard) {
      //   toast.success(
      //     `MetaMask Card verified! Welcome ${result.cardTier.tier} member`,
      //     {
      //       duration: 5000,
      //       position: 'top-center',
      //     },
      //   )
      // }
    } catch (error: any) {
      toast.error(error?.message || error || 'Failed to connect wallet', {
        duration: 3000,
        position: 'top-center',
      })
    }
  }, [connectWallet, dispatch])

  useEffect(() => {
    // Only check once on mount for existing connection
    if (window.ethereum?.selectedAddress && !userEvmAccount.address) {
      getAccount()
    }
  }, []) // Empty dependency - only run once on mount

  const beginTransfer = async () => {
    if (!userToken?.address) {
      toast.error('Select a token first!', {
        duration: 1100,
        position: 'top-center',
      })
      return
    }

    if (!userEvmAccount.address) {
      toast.error('Connect wallet first!', {
        duration: 1100,
        position: 'top-center',
      })
      return
    }

    try {
      // Here you would integrate with the bridge functionality
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

  // Calculate fee reduction based on card tier
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
    <div className="h-[100vh] bg-[#1F2026]">
      <Navbar />
      <div className="flex lg:absolute lg:top-1/2 lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2">
        <div
          className="flex flex-col items-center justify-center flex-1 checkout-container text-secondary lg:items-start"
          style={{ position: 'relative' }}
        >
          <div className="checkout-header font-headings">
            <img
              src="/images/logo.jpg"
              className="logo"
              width={100}
              height={100}
              alt="Logo"
            />
            <span>Pay with Hati</span>
          </div>

          <div className="checkout-card">
            <div className="checkout-card__header">
              <h3 className="title">Checkout</h3>
              {userEvmAccount.address && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-md">
                      {userEvmAccount.address.substring(0, 5)}.....
                      {userEvmAccount.address.substring(37)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await disconnect()
                        dispatch(disconnectWallet())
                        toast.success('Wallet disconnected', {
                          duration: 2000,
                          position: 'top-center',
                        })
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Disconnect
                    </Button>
                  </div>
                  {feeReduction > 0 && (
                    <span className="text-xs text-green-400">
                      {feeReduction}% fee reduction active
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* MetaMask Card Verification */}
            {userEvmAccount.address && (
              <div className="mb-4">
                <CardVerification />
              </div>
            )}

            {activeTab === 'DEFAULT' && (
              <MerchantLayer
                network={chain}
                token={merchantToken}
                amount={Number(merchantAmount)}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'DEFAULT' && (
              <div className="checkout-card__body">
                {userToken ? (
                  <UserLayer
                    network={selectedChain.title}
                    token={selectedToken}
                    amount={Number(merchantAmount)}
                    price={ethPrice}
                    setActiveTab={setActiveTab}
                  />
                ) : (
                  <div
                    className="my-3 token-swap-card select-token"
                    onClick={() => {
                      if (userEvmAccount.address) {
                        setActiveTab('SELECT_TOKEN')
                      } else {
                        getAccount()
                      }
                    }}
                  >
                    <h4>You pay</h4>
                    <div className="pb-3 swap-area empty">
                      <span className="token-swap__text">
                        Select chain/ token
                      </span>
                    </div>
                    <div className="pt-3 fiat-area"></div>
                  </div>
                )}

                {!bridgeComplete && (
                  <div className="my-3 token-swap-card">
                    <h4>Send to merchant address</h4>
                    <div className="pb-3 swap-area">
                      <span className="token-swap__amount">
                        {`${merchantAddress.substring(
                          0,
                          6,
                        )}.......${merchantAddress.substring(36)}`}
                      </span>
                      <div className="token-image-details">
                        <img
                          src={`/images/chains/${chain
                            .split(' ')[0]
                            .toLowerCase()}.svg`}
                          alt="token"
                          className="network-image"
                          width={20}
                          height={20}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {bridgeComplete && (
                  <div className="my-3 bg-[#EBE8E2]/90 token-swap-card">
                    <p className="mb-3 text-2xl font-semibold text-secondary-foreground">
                      Checkout complete
                    </p>
                    <Link
                      className="flex items-center gap-2 "
                      target="_blank"
                      href={`https://li.fi/tx/${transactionHash}`}
                    >
                      View transaction details
                      <MdArrowOutward />
                    </Link>
                  </div>
                )}

                {bridgeComplete && (
                  <Button
                    onClick={() => dispatch(setBridgeComplete(false))}
                    className="w-full rounded"
                  >
                    Make a new Payment
                  </Button>
                )}

                {bridgeComplete ? null : (
                  <Button
                    variant="nav"
                    className="w-full btn-primary"
                    onClick={() =>
                      userEvmAccount.address ? beginTransfer() : getAccount()
                    }
                    disabled={loading || isVerifyingCard}
                  >
                    {loading || isVerifyingCard ? (
                      <div className="flex items-center gap-2">
                        <LoadingIcon />
                        {isVerifyingCard
                          ? 'Verifying Card...'
                          : 'Processing...'}
                      </div>
                    ) : userEvmAccount.address ? (
                      'Pay Now'
                    ) : (
                      'Connect Wallet'
                    )}
                  </Button>
                )}
              </div>
            )}

            {activeTab === 'SELECT_TOKEN' && (
              <SelectToken
                setActiveTab={setActiveTab}
                setToken={setUserToken}
                amount={merchantAmount}
              />
            )}

            {activeTab === 'SET_MERCHANT' && (
              <SetMerchant setActiveTab={setActiveTab} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transfer
