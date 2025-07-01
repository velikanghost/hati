import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowRightLeft,
  Shield,
  Zap,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { LoadingIcon } from '@/components/icons/loadingIcon'
import { HatiWalletManager } from '@/components/hatiWalletManager'
import CardVerification from '@/components/cardVerification'
import { connectMetaMask, createHatiWallet } from '@/store/slices/walletSlice'
import type { RootState, AppDispatch } from '@/store'

export const HatiDemo: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const walletState = useSelector((state: RootState) => state.wallet)

  const [demoStep, setDemoStep] = useState<
    'wallet-selection' | 'user-flow' | 'merchant-flow'
  >('wallet-selection')
  const [userType, setUserType] = useState<'user' | 'merchant'>('user')
  const [demoUserId] = useState(
    `demo-${Math.random().toString(36).substr(2, 9)}`,
  )

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Secure by Design',
      description:
        "Circle's developer-controlled wallets with automated yield generation",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Automatic Yield',
      description:
        '50% of merchant funds automatically earn yield through DeFi protocols',
    },
    {
      icon: <ArrowRightLeft className="w-5 h-5" />,
      title: 'Cross-Chain Payments',
      description: 'Accept payments on multiple chains with LiFi bridging',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'MetaMask Integration',
      description:
        'Enhanced experience for MetaMask card holders with tier-based benefits',
    },
  ]

  const paymentFlow = [
    {
      step: 1,
      title: 'Connect Wallet',
      description: 'User connects MetaMask or creates Hati wallet',
      status: walletState.currentWalletType ? 'completed' : 'pending',
    },
    {
      step: 2,
      title: 'Verify Card (Optional)',
      description: 'MetaMask card verification for enhanced benefits',
      status: walletState.cardTier?.hasCard ? 'completed' : 'optional',
    },
    {
      step: 3,
      title: 'Select Payment Method',
      description: 'Choose between MetaMask or Hati wallet',
      status: walletState.currentWalletType ? 'completed' : 'pending',
    },
    {
      step: 4,
      title: 'Process Payment',
      description:
        'Cross-chain payment via LiFi with automatic yield allocation',
      status: 'pending',
    },
  ]

  useEffect(() => {
    // Demo initialization
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      console.log('🎭 Hati Demo Mode Active')
    }
  }, [])

  const handleWalletTypeChange = (type: 'metamask' | 'hati') => {
    if (type === 'metamask') {
      dispatch(connectMetaMask())
    } else {
      dispatch(
        createHatiWallet({
          userId: demoUserId,
          isMerchant: userType === 'merchant',
        }),
      )
    }
    setDemoStep('user-flow')
  }

  const renderWalletSelection = () => (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
          Hati Payment Gateway
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600">
          Experience the future of Web3 payments with MetaMask Dev Card
          integration, Circle developer-controlled wallets, and automatic DeFi
          yield generation.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {features.map((feature, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <div className="p-2 mr-3 bg-blue-100 rounded-lg">
                  {feature.icon}
                </div>
                {feature.title}
              </CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* User Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Role</CardTitle>
          <CardDescription>
            Experience the demo as either a user or merchant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              variant={userType === 'user' ? 'default' : 'outline'}
              onClick={() => setUserType('user')}
              className="flex flex-col h-20"
            >
              <Wallet className="w-6 h-6 mb-2" />
              <span className="font-semibold">User</span>
              <span className="text-xs">Make payments with yield benefits</span>
            </Button>
            <Button
              variant={userType === 'merchant' ? 'default' : 'outline'}
              onClick={() => setUserType('merchant')}
              className="flex flex-col h-20"
            >
              <TrendingUp className="w-6 h-6 mb-2" />
              <span className="font-semibold">Merchant</span>
              <span className="text-xs">Receive payments with auto-yield</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Options */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="transition-shadow border-2 cursor-pointer hover:shadow-lg hover:border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 mr-3 bg-orange-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>MetaMask Wallet</CardTitle>
                  <CardDescription>
                    Connect existing MetaMask wallet
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Popular</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2 text-sm text-gray-600">
              <li>• MetaMask Dev Card verification</li>
              <li>• Tier-based fee reductions</li>
              <li>• Cross-chain bridging via LiFi</li>
            </ul>
            <Button
              onClick={() => handleWalletTypeChange('metamask')}
              disabled={walletState.isConnecting}
              className="w-full"
            >
              {walletState.isConnecting &&
              walletState.currentWalletType === null ? (
                <>
                  <LoadingIcon />
                  Connecting...
                </>
              ) : (
                'Connect MetaMask'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow border-2 cursor-pointer hover:shadow-lg hover:border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 mr-3 bg-purple-100 rounded-lg">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Hati Wallet</CardTitle>
                  <CardDescription>
                    Create new yield-earning wallet
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-green-800 bg-green-100"
              >
                New
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2 text-sm text-gray-600">
              <li>• Circle developer-controlled wallets</li>
              <li>• Automatic DeFi yield generation</li>
              <li>
                •{' '}
                {userType === 'merchant'
                  ? 'Multi-chain support'
                  : 'Secure & gas-efficient'}
              </li>
            </ul>
            <Button
              onClick={() => handleWalletTypeChange('hati')}
              disabled={walletState.isCreatingHatiWallet}
              className="w-full"
              variant="outline"
            >
              {walletState.isCreatingHatiWallet ? (
                <>
                  <LoadingIcon />
                  Creating...
                </>
              ) : (
                'Create Hati Wallet'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderUserFlow = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Flow Demo</h2>
          <p className="text-gray-600">
            {userType === 'merchant'
              ? 'Merchant Dashboard'
              : 'User Payment Experience'}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {userType.charAt(0).toUpperCase() + userType.slice(1)} Mode
        </Badge>
      </div>

      {/* Payment Flow Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Payment Flow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentFlow.map((item) => (
              <div key={item.step} className="flex items-center space-x-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'optional'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    item.step
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-600">
                    {item.description}
                  </div>
                </div>
                <Badge
                  variant={
                    item.status === 'completed' ? 'default' : 'secondary'
                  }
                  className={
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : ''
                  }
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Wallet Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            {walletState.currentWalletType === 'metamask' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">MetaMask Wallet</span>
                  <Badge className="text-orange-800 bg-orange-100">
                    Connected
                  </Badge>
                </div>
                <div className="font-mono text-sm text-gray-600">
                  {walletState.metaMaskAddress?.slice(0, 8)}...
                  {walletState.metaMaskAddress?.slice(-6)}
                </div>
                {walletState.cardTier && <CardVerification />}
              </div>
            ) : walletState.currentWalletType === 'hati' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Hati Wallet</span>
                  <Badge className="text-purple-800 bg-purple-100">
                    Connected
                  </Badge>
                </div>
                {walletState.primaryHatiWallet && (
                  <div className="font-mono text-sm text-gray-600">
                    {walletState.primaryHatiWallet.address.slice(0, 8)}...
                    {walletState.primaryHatiWallet.address.slice(-6)}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No wallet connected</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Actions</CardTitle>
            <CardDescription>Test the payment flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setDemoStep('wallet-selection')}
              className="w-full"
            >
              Change Wallet Type
            </Button>
            <Button
              onClick={() =>
                setUserType(userType === 'user' ? 'merchant' : 'user')
              }
              className="w-full"
            >
              Switch to {userType === 'user' ? 'Merchant' : 'User'} View
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.success('Demo payment simulation completed!')
              }
              className="w-full"
              disabled={!walletState.currentWalletType}
            >
              Simulate Payment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Hati Wallet Manager */}
      {walletState.currentWalletType === 'hati' && (
        <HatiWalletManager
          userType={userType}
          userId={demoUserId}
          showPaymentOptions={true}
        />
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container px-4 py-8 mx-auto">
        {demoStep === 'wallet-selection' && renderWalletSelection()}
        {demoStep === 'user-flow' && renderUserFlow()}

        {/* Error Display */}
        {walletState.error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{walletState.error}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-3"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
