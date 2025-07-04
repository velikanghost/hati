# Hati: MetaMask Card-Powered Smart Payment Gateway 🚀

![Next.js](https://img.shields.io/badge/Next.js-Framework-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Circle](https://img.shields.io/badge/Circle-Wallets-green)
![MetaMask](https://img.shields.io/badge/MetaMask-SDK-orange)

> Cross-chain payment gateway with MetaMask Card benefits and smart yield optimization

## 🎯 Problem Statement

In today's crypto payment landscape, both merchants and customers face significant challenges:

### For Merchants 🏪

- **Wallet Management Headache**: Like juggling multiple cash registers, merchants need separate wallets for different blockchains
- **Token Conversion Complexity**: Accepting various tokens but wanting USDC is like running a currency exchange inside your store
- **Lost Yield Opportunities**: Settled funds sit idle in wallets, similar to keeping money under the mattress instead of in an interest-bearing account

### For Customers 👥

- **Payment Friction**: Need to navigate complex blockchain bridges just to make a purchase
- **Token Uncertainty**: Never sure which tokens a merchant accepts on which networks
- **Complex User Experience**: Must understand blockchain technicalities to make basic payments

## 💡 Solution

Hati solves these challenges through four integrated components:

1. **MetaMask Card Integration**

   - Card verification and tier benefits
   - Reduced transaction fees based on tier
   - Enhanced security features
   - Premium merchant services

2. **Smart Payment Gateway**

   - Cross-chain token acceptance
   - USDC settlement via LI.FI + CCTP
   - Automated fee optimization
   - Real-time transaction tracking

3. **Circle Wallet Infrastructure**

   - Secure merchant wallets
   - USDC-focused treasury
   - Cross-chain settlement
   - Enterprise-grade security

4. **Smart Liquidity Agent**
   - Automated yield optimization
   - Risk-adjusted returns
   - Protocol diversification
   - Real-time rebalancing

## 🧠 Smart Payment Features

### 1. MetaMask Card Benefits

```typescript
interface CardTier {
  hasCard: boolean
  tier: 'basic' | 'premium' | 'elite'
  benefits: string[]
  contractInteractions: number
  delegationAmount?: string
}

// Example benefits by tier
const benefits = {
  elite: [
    '0% transaction fees',
    'Advanced yield strategies',
    'Priority support',
    'White-glove onboarding',
    'Custom integrations',
  ],
  premium: [
    '50% reduced fees',
    'Automated optimization',
    'Monthly reports',
    'Enhanced security',
    'Priority processing',
  ],
  basic: [
    'Standard fees',
    'Basic yield optimization',
    'Community support',
    'Email notifications',
  ],
}
```

### 2. Payment Processing

```typescript
// Shopper.tsx - Payment Processing
const beginTransfer = async () => {
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
      sourceChain,
      tokenEquivalent,
      destinationAddress,
      txHash: result.txHash,
    })
    setShowConfirmationModal(true)
  }
}
```

### 3. Circle Wallet Integration

```typescript
class CircleWalletService {
  async createMerchantWallet(
    userAddress: string,
    cardTier: string,
  ): Promise<{
    id: string
    address: string
    blockchain: string
    walletType: 'merchant'
    userId: string
    network: string
    createdAt: string
  }> {
    // Implementation details...
  }

  async transferUsdc(
    walletId: string,
    destinationAddress: string,
    amount: string,
  ): Promise<{
    id: string
    state: string
  }> {
    // Implementation details...
  }

  async getWalletBalance(walletId: string): Promise<WalletBalanceData> {
    // Implementation details...
  }
}
```

### 4. Card Verification Component

```typescript
const CardVerification: React.FC = () => {
  const { cardTier, isVerifyingCard, userEvmAddress } = useAppSelector(
    (state) => state.connect,
  )

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'elite':
        return [
          '0% transaction fees',
          'Advanced yield strategies',
          'Priority support',
          'White-glove onboarding',
          'Custom integrations',
        ]
      case 'premium':
        return [
          '50% reduced fees',
          'Automated optimization',
          'Monthly reports',
          'Enhanced security',
        ]
      default:
        return [
          'Standard fees',
          'Basic yield optimization',
          'Community support',
        ]
    }
  }

  // Render verification UI based on card status
  return (
    <div className="card-verification-container">
      {cardTier?.hasCard ? (
        <VerifiedCardDisplay
          tier={cardTier.tier}
          benefits={getTierBenefits(cardTier.tier)}
        />
      ) : (
        <UnverifiedCardDisplay />
      )}
    </div>
  )
}
```

### 3. Merchant Dashboard

```plaintext
┌─────────────────┐    ┌──────────────┐    ┌────────────────┐
│ Payment Gateway │───▶│ Circle Wallet │───▶│ Yield Strategy │
│ - Multi-token   │    │ - USDC Focus │    │ - Auto-optimze │
│ - Cross-chain   │    │ - Security   │    │ - Risk-adjust  │
└─────────────────┘    └──────────────┘    └────────────────┘
         ▲                    │                     │
         │                    ▼                     ▼
┌─────────────────┐    ┌──────────────┐    ┌────────────────┐
│  MetaMask Card  │    │ Transaction  │    │  Performance   │
│  - Verification │────▶ Processing   │────▶   Analytics    │
│  - Benefits     │    │ & Routing    │    │   & Reports    │
└─────────────────┘    └──────────────┘    └────────────────┘
```

## 🏗 Architecture

```plaintext
hati/
├── src/
│   ├── app/
│   │   ├── api/                  # API routes
│   │   │   ├── circle/          # Circle wallet endpoints
│   │   │   ├── hati/            # Core payment logic
│   │   │   ├── lifi/            # Bridge integration
│   │   │   └── merchant/        # Merchant services
│   │   ├── merchant/            # Merchant dashboard
│   │   └── shoppers/            # Payment interface
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Core utilities
│   │   ├── services/            # Business logic
│   │   └── types/              # TypeScript types
│   └── store/                   # Redux store
└── public/                      # Static assets
```

## 🔧 Core Components

### Payment Gateway

```typescript
interface PaymentProcessor {
  // Multi-chain payment processing
  processPayment(params: {
    amount: string
    sourceToken: Token
    destinationChain: Chain
    merchantWallet: string
    cardTier: CardTier
  }): Promise<TransactionResult>
}
```

### Circle Wallet Integration

```typescript
class CircleWalletService {
  // Merchant wallet management
  async createMerchantWallet(params: {
    userAddress: string
    cardTier: string
  }): Promise<WalletInfo>

  // USDC transfers
  async transferUsdc(params: {
    walletId: string
    destinationAddress: string
    amount: string
  }): Promise<TransferResult>
}
```

### Smart Liquidity Agent

```typescript
class SmartLiquidityAgent {
  // Yield optimization
  async optimizeYield(params: {
    merchantAddress: string
    usdcAmount: number
    riskTolerance: RiskLevel
  }): Promise<YieldStrategy>
}
```

## 🎯 Key Features

### Merchant Benefits

- Automated USDC settlement
- Cross-chain payment acceptance
- Smart yield optimization
- Real-time analytics
- MetaMask Card tier benefits

### Security Features

- Circle wallet infrastructure
- Multi-signature support
- Rate limiting
- Transaction monitoring
- Automated safety checks

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/hati
cd hati

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Environment Configuration

```env
# Circle API Configuration
CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=

# LI.FI Configuration
LIFI_API_KEY=
LIFI_INTEGRATOR_ID=

# MetaMask Configuration
METAMASK_API_KEY=

# Network Configuration
MERCHANT_NETWORK_RPC=
MERCHANT_NETWORK_CHAIN_ID=
MERCHANT_NETWORK_USDC=

# API Configuration
NEXT_PUBLIC_API_URL=
```

## 📚 API Documentation

### Core Endpoints

#### Payment Processing

```http
POST /api/hati/payment           # Process payment
GET  /api/hati/payment/:id      # Get payment status
POST /api/hati/payment/refund   # Process refund
```

#### Merchant Operations

```http
POST /api/merchant/wallet/create    # Create merchant wallet
GET  /api/merchant/balance          # Get wallet balance
POST /api/merchant/withdraw         # Withdraw funds
GET  /api/merchant/transactions     # Get transaction history
```

#### Yield Optimization

```http
POST /api/hati/liquidity/optimize   # Optimize yield
GET  /api/hati/stats                # Get performance stats
```

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
```

## 🛣 Roadmap

### Phase 1: Core Infrastructure ✅

- [x] Payment gateway integration
- [x] Circle wallet implementation
- [x] MetaMask Card verification

### Phase 2: Advanced Features

- [ ] Basic yield optimization
- [ ] Enhanced analytics dashboard
- [ ] Advanced yield strategies
- [ ] Mobile app development

## 👥 Target Users

### Merchants

- Accept crypto payments seamlessly
- Automatic USDC settlement
- Smart yield optimization
- Real-time analytics

### Shoppers

- Pay with any supported token
- Cross-chain transactions
- MetaMask Card benefits
- Transaction tracking

## 🔒 Security

- **Circle wallet security**
- **Rate limiting** protection
- **Input validation**
- **Transaction monitoring**
- **Automated safety checks**

## 📄 License

This project is licensed under the MIT License

---

<p align="center">Built with ❤️ by the Hati Team</p>
