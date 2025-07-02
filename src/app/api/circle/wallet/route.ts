import { NextRequest, NextResponse } from 'next/server'
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'

interface CreateWalletRequest {
  userAddress: string
  cardTier: 'basic' | 'premium' | 'elite'
}

interface HatiWallet {
  id: string
  address: string
  blockchain: string
  walletType: 'merchant'
  userId: string
  network: string
  createdAt: string
}

class HatiCircleWalletService {
  private circleSdk: any
  private readonly SUPPORTED_BLOCKCHAINS = ['EVM']

  constructor() {
    if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) {
      throw new Error(
        'Circle API credentials not configured. Please set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET in your .env file',
      )
    }

    this.circleSdk = initiateDeveloperControlledWalletsClient({
      baseUrl: 'https://api.circle.com',
      apiKey: process.env.CIRCLE_API_KEY,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET,
    })
  }

  async createHatiWallet(
    userAddress: string,
    cardTier: string,
  ): Promise<HatiWallet> {
    try {
      console.log(
        `🔄 Creating Hati wallet for ${userAddress} with ${cardTier} tier...`,
      )

      // Create wallet set first (this groups related wallets)
      const walletSetResponse = await this.circleSdk.createWalletSet({
        name: `hati-merchant-${userAddress.toLowerCase().slice(0, 8)}`,
      })

      const walletSetId = walletSetResponse.data?.walletSet?.id
      if (!walletSetId) {
        throw new Error('Failed to create wallet set')
      }

      // Create the actual wallet
      const walletResponse = await this.circleSdk.createWallets({
        accountType: 'EOA',
        blockchains: this.SUPPORTED_BLOCKCHAINS,
        count: 1,
        walletSetId: walletSetId,
      })

      const wallet = walletResponse.data?.wallets?.[0]
      if (!wallet) {
        throw new Error('Failed to create wallet')
      }

      console.log(`✅ Hati wallet created: ${wallet.id}`)

      return {
        id: wallet.id,
        address: wallet.address,
        blockchain: wallet.blockchain,
        walletType: 'merchant',
        userId: userAddress,
        network: this.getNetworkName(wallet.blockchain),
        createdAt: new Date().toISOString(),
      }
    } catch (error: any) {
      console.error('❌ Error creating Hati wallet:', error)
      throw new Error(`Failed to create Hati wallet: ${error.message}`)
    }
  }

  async getWalletBalance(walletId: string) {
    try {
      const response = await this.circleSdk.getWallet({ id: walletId })
      const balanceResponse = await this.circleSdk.getWalletTokenBalance({
        id: walletId,
      })

      return {
        walletId,
        address: response.data?.wallet?.address,
        blockchain: response.data?.wallet?.blockchain,
        balances: balanceResponse.data?.tokenBalances || [],
        nativeBalance: response.data?.wallet?.balance || '0',
      }
    } catch (error: any) {
      console.error('Error getting wallet balance:', error)
      throw new Error(`Failed to get wallet balance: ${error.message}`)
    }
  }

  async signTransaction(walletId: string, transaction: any) {
    try {
      const response = await this.circleSdk.signTransaction({
        walletId,
        transaction: JSON.stringify(transaction),
      })

      return {
        signedTransaction: response.data?.signedTransaction,
        transactionHash: response.data?.transactionHash,
      }
    } catch (error: any) {
      console.error('Error signing transaction:', error)
      throw new Error(`Failed to sign transaction: ${error.message}`)
    }
  }

  private getNetworkName(blockchain: string): string {
    if (blockchain === 'EVM') {
      return 'Linea'
    }
    return blockchain
  }

  getWalletInfo() {
    return {
      supportedBlockchains: this.SUPPORTED_BLOCKCHAINS,
      features: [
        'Linea-focused merchant wallets using Circle EVM support',
        'USDC-focused payment processing on Linea',
        'EOA wallet generation for receiving payments',
        'Cross-chain payment bridging via LiFi',
        'Enterprise-grade security',
      ],
      sdkVersion: '8.3.0',
      network: 'Linea Mainnet (59144)',
      note: 'Hati uses Circle generic EVM support for Linea merchant wallets',
    }
  }
}

// Initialize the service
const hatiWalletService = new HatiCircleWalletService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, cardTier } = body as CreateWalletRequest

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 },
      )
    }

    // Validate card tier
    const validTiers = ['basic', 'premium', 'elite']
    if (cardTier && !validTiers.includes(cardTier)) {
      return NextResponse.json(
        { error: 'Invalid card tier. Must be basic, premium, or elite' },
        { status: 400 },
      )
    }

    const wallet = await hatiWalletService.createHatiWallet(
      userAddress,
      cardTier || 'basic',
    )

    console.log(`✅ Hati wallet API success: ${wallet.id} for ${userAddress}`)

    return NextResponse.json(wallet)
  } catch (error: any) {
    console.error('❌ Hati wallet API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get('walletId')
    const action = searchParams.get('action')

    if (action === 'info') {
      return NextResponse.json(hatiWalletService.getWalletInfo())
    }

    if (walletId && action === 'balance') {
      const balance = await hatiWalletService.getWalletBalance(walletId)
      return NextResponse.json(balance)
    }

    return NextResponse.json(
      {
        error:
          'Invalid request. Specify action=info or action=balance&walletId=<id>',
      },
      { status: 400 },
    )
  } catch (error: any) {
    console.error('GET /api/circle/wallet error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
