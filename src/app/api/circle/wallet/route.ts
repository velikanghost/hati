import { NextRequest, NextResponse } from 'next/server'
import { circleWalletService } from '@/lib/services/circleWalletService'

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

// Use the enhanced service from our services directory
// The HatiCircleWalletService is now replaced by the enhanced CircleWalletService

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userAddress, cardTier, walletId, transaction } = body

    if (action === 'createWallet') {
      if (!userAddress || !cardTier) {
        return NextResponse.json(
          { success: false, error: 'userAddress and cardTier are required' },
          { status: 400 },
        )
      }

      console.log(
        `🔄 Creating Hati wallet for ${userAddress} with ${cardTier} tier`,
      )

      try {
        const wallet = await circleWalletService.createMerchantWallet(
          userAddress,
          cardTier,
        )

        return NextResponse.json({
          success: true,
          data: wallet,
        })
      } catch (error: any) {
        console.error('Wallet creation failed:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 },
        )
      }
    }

    if (action === 'getBalance') {
      if (!walletId) {
        return NextResponse.json(
          { success: false, error: 'walletId is required' },
          { status: 400 },
        )
      }

      try {
        const balance = await circleWalletService.getWalletBalance(walletId)
        return NextResponse.json({ success: true, data: balance })
      } catch (error: any) {
        console.error('Balance fetch failed:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 },
        )
      }
    }

    if (action === 'signTransaction') {
      if (!walletId || !transaction) {
        return NextResponse.json(
          { success: false, error: 'walletId and transaction are required' },
          { status: 400 },
        )
      }

      try {
        const result = await circleWalletService.signTransaction(
          walletId,
          transaction,
        )
        return NextResponse.json({ success: true, data: result })
      } catch (error: any) {
        console.error('Transaction signing failed:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 },
    )
  } catch (error: any) {
    console.error('POST /api/circle/wallet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
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
      return NextResponse.json(circleWalletService.getServiceInfo())
    }

    if (action === 'test') {
      console.log('🧪 Testing Circle API connection...')
      const testResult = await circleWalletService.testConnection()

      return NextResponse.json({
        ...testResult,
        timestamp: new Date().toISOString(),
        environment: {
          hasApiKey: !!process.env.CIRCLE_API_KEY,
          hasEntitySecret: !!process.env.CIRCLE_ENTITY_SECRET,
          apiKeyPrefix: process.env.CIRCLE_API_KEY?.substring(0, 8) + '...',
        },
      })
    }

    if (walletId && action === 'balance') {
      console.log(`🔍 Fetching balance for wallet: ${walletId}`)

      try {
        const balance = await circleWalletService.getWalletBalance(walletId)
        return NextResponse.json({
          success: true,
          data: balance,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        console.error('Balance fetch failed:', error)
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            walletId,
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        )
      }
    }

    if (walletId && action === 'info') {
      console.log(`🔍 Fetching info for wallet: ${walletId}`)

      try {
        const info = await circleWalletService.getWalletInfo(walletId)
        return NextResponse.json({
          success: true,
          data: info,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        console.error('Wallet info fetch failed:', error)
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            walletId,
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        error:
          'Invalid request. Available actions: info, test, balance, or wallet info',
        usage: {
          serviceInfo: '?action=info',
          testConnection: '?action=test',
          walletBalance: '?action=balance&walletId=<id>',
          walletInfo: '?action=info&walletId=<id>',
        },
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
