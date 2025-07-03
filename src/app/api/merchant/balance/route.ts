import { NextRequest, NextResponse } from 'next/server'
import { circleWalletService } from '@/lib/services/circleWalletService'
import { db } from '@/lib/database'

interface BalanceResponse {
  success: boolean
  data?: {
    walletId: string
    address: string
    blockchain: string
    nativeBalance: string
    tokenBalances: Array<{
      token: string
      symbol: string
      amount: string
      decimals: number
      contractAddress?: string
    }>
    totalUsdcBalance: string
    formattedUsdcBalance: string
    lastUpdated: string
  }
  error?: string
  debug?: any
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<BalanceResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get('walletId')

    console.log(`🔍 Balance request: walletId=${walletId}`)

    // Validate input
    if (!walletId) {
      return NextResponse.json(
        {
          success: false,
          error: 'walletId is required',
        },
        { status: 400 },
      )
    }

    let targetWalletId = walletId

    if (!targetWalletId) {
      console.log('❌ No wallet ID found')
      return NextResponse.json(
        {
          success: false,
          error: 'No wallet ID found for this session',
        },
        { status: 404 },
      )
    }

    // Validate wallet ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetWalletId)) {
      console.log(`❌ Invalid wallet ID format: ${targetWalletId}`)
      return NextResponse.json(
        {
          success: false,
          error: `Invalid wallet ID format: ${targetWalletId}`,
          debug: { walletId: targetWalletId, format: 'expected UUID v4' },
        },
        { status: 400 },
      )
    }

    console.log(`🔄 Fetching balance for wallet: ${targetWalletId}`)

    // Fetch balance from Circle
    const balanceData = await circleWalletService.getWalletBalance(
      targetWalletId,
    )

    // Format USDC balance for display (convert from smallest unit)
    const usdcAmount =
      parseFloat(balanceData.totalUsdcBalance) / Math.pow(10, 6) // USDC has 6 decimals
    const formattedUsdcBalance = usdcAmount.toFixed(2)

    console.log(
      `✅ Balance retrieved successfully: $${formattedUsdcBalance} USDC`,
    )

    return NextResponse.json({
      success: true,
      data: {
        ...balanceData,
        formattedUsdcBalance,
      },
    })
  } catch (error: any) {
    console.error('Balance API error:', error)

    // Provide more specific error information
    let errorMessage = error.message || 'Failed to fetch balance'
    let statusCode = 500

    if (error.message?.includes('Invalid wallet ID')) {
      statusCode = 400
    } else if (error.message?.includes('authentication')) {
      statusCode = 401
      errorMessage = 'Circle API authentication failed'
    } else if (error.message?.includes('not found')) {
      statusCode = 404
      errorMessage = 'Wallet not found'
    } else if (error.message?.includes('rate limit')) {
      statusCode = 429
      errorMessage = 'Rate limit exceeded, please try again later'
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        debug: {
          originalError: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode },
    )
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<BalanceResponse>> {
  try {
    const body = await request.json()
    const { walletId, action } = body

    console.log(
      `🔄 Balance refresh request: action=${action}, walletId=${walletId}`,
    )

    if (action !== 'refresh') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "refresh" to force balance update',
        },
        { status: 400 },
      )
    }

    // Validate input - need either sessionToken or walletId
    if (!walletId) {
      return NextResponse.json(
        {
          success: false,
          error: 'walletId is required',
        },
        { status: 400 },
      )
    }

    let targetWalletId = walletId

    if (!targetWalletId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No wallet ID found for this session',
        },
        { status: 404 },
      )
    }

    // Validate wallet ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetWalletId)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid wallet ID format: ${targetWalletId}`,
          debug: { walletId: targetWalletId, format: 'expected UUID v4' },
        },
        { status: 400 },
      )
    }

    console.log(`🔄 Force refreshing balance for wallet: ${targetWalletId}`)

    // Force refresh balance from Circle (no caching)
    const balanceData = await circleWalletService.getWalletBalance(
      targetWalletId,
    )

    // Format USDC balance for display
    const usdcAmount =
      parseFloat(balanceData.totalUsdcBalance) / Math.pow(10, 6)
    const formattedUsdcBalance = usdcAmount.toFixed(2)

    console.log(
      `✅ Balance refreshed for wallet ${targetWalletId}: $${formattedUsdcBalance} USDC`,
    )

    return NextResponse.json({
      success: true,
      data: {
        ...balanceData,
        formattedUsdcBalance,
      },
    })
  } catch (error: any) {
    console.error('Balance refresh API error:', error)

    // Provide more specific error information
    let errorMessage = error.message || 'Failed to refresh balance'
    let statusCode = 500

    if (error.message?.includes('Invalid wallet ID')) {
      statusCode = 400
    } else if (error.message?.includes('authentication')) {
      statusCode = 401
      errorMessage = 'Circle API authentication failed'
    } else if (error.message?.includes('not found')) {
      statusCode = 404
      errorMessage = 'Wallet not found'
    } else if (error.message?.includes('rate limit')) {
      statusCode = 429
      errorMessage = 'Rate limit exceeded, please try again later'
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        debug: {
          originalError: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode },
    )
  }
}
