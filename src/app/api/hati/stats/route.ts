import { NextRequest, NextResponse } from 'next/server'
import { transactionStatsService } from '@/lib/services/transactionStatsService'
import { circleWalletService } from '@/lib/services/circleWalletService'
import { db } from '@/lib/database'

interface DashboardStatsResponse {
  success: boolean
  data?: {
    profile: {
      id: string
      metamaskAddress: string
      hatiWalletId: string
      hatiWalletAddress: string
      businessName: string
      businessType: string | null
      website: string | null
      preferredCurrency: string
      riskTolerance: 'conservative' | 'moderate' | 'aggressive'
      isActive: boolean
      createdAt: string
      updatedAt: string
    }
    stats: {
      totalPayments: number
      totalVolume: number
      monthlyGrowth: number
      yieldEarned: number
      avgTransactionTime: number
      successRate: number
      thisMonthVolume: number
      lastMonthVolume: number
    }
    recentTransactions: Array<{
      id: string
      transactionHash: string
      sourceChain: string
      destinationChain: string
      amount: string
      usdValue: string | null
      status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
      protocol: string | null
      bridgeTime: number | null
      createdAt: string
      from?: string
    }>
    balanceOverview: {
      totalUsdcBalance: string
      formattedUsdcBalance: string
      hatiBalance: any
      lastUpdated: string
    }
  }
  error?: string
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<DashboardStatsResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const sessionToken = searchParams.get('sessionToken')

    if (action !== 'dashboard') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use action=dashboard',
        },
        { status: 400 },
      )
    }

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionToken is required',
        },
        { status: 400 },
      )
    }

    // Validate session and get merchant profile
    const session = await db.merchantSession.findUnique({
      where: { sessionToken },
      include: { merchant: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired session token',
        },
        { status: 401 },
      )
    }

    if (!session.merchant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Merchant profile not found',
        },
        { status: 404 },
      )
    }

    const merchant = session.merchant

    // Get all data in parallel for better performance
    const [stats, recentTransactions, balanceData] = await Promise.all([
      // Get real transaction statistics
      transactionStatsService.getMerchantStats(merchant.metamaskAddress),

      // Get recent transactions
      transactionStatsService.getRecentTransactions(
        merchant.metamaskAddress,
        5,
      ),

      // Get current balance from Circle wallet
      merchant.hatiWalletId
        ? circleWalletService
            .getWalletBalance(merchant.hatiWalletId)
            .catch((error) => {
              console.warn('Failed to fetch Circle balance:', error)
              return null
            })
        : Promise.resolve({
            walletId: merchant.hatiWalletId || '',
            address: merchant.hatiWalletAddress,
            blockchain: 'EVM',
            nativeBalance: '0',
            tokenBalances: [],
            totalUsdcBalance: '0',
            lastUpdated: new Date().toISOString(),
          }),
    ])

    // Format balance for display
    const usdcAmount =
      parseFloat(balanceData?.totalUsdcBalance || '0') / Math.pow(10, 6) // USDC has 6 decimals
    const formattedUsdcBalance = usdcAmount.toFixed(2)

    // Map risk tolerance to card tier for backward compatibility
    const getCardTier = (riskTolerance: string) => {
      switch (riskTolerance) {
        case 'AGGRESSIVE':
          return 'Elite'
        case 'MODERATE':
          return 'Premium'
        case 'CONSERVATIVE':
          return 'Basic'
        default:
          return 'Basic'
      }
    }

    const response = {
      success: true,
      data: {
        profile: {
          id: merchant.id,
          metamaskAddress: merchant.metamaskAddress,
          hatiWalletId: merchant.hatiWalletId,
          hatiWalletAddress: merchant.hatiWalletAddress,
          businessName: merchant.businessName,
          businessType: merchant.businessType,
          website: merchant.website,
          preferredCurrency: merchant.preferredCurrency,
          riskTolerance: merchant.riskTolerance.toLowerCase() as
            | 'conservative'
            | 'moderate'
            | 'aggressive',
          isActive: merchant.isActive,
          createdAt: merchant.createdAt.toISOString(),
          updatedAt: merchant.updatedAt.toISOString(),
        },
        stats,
        recentTransactions,
        balanceOverview: {
          totalUsdcBalance: balanceData?.totalUsdcBalance || '0',
          formattedUsdcBalance,
          hatiBalance: {
            address: balanceData?.address || '',
            blockchain: balanceData?.blockchain || '',
            nativeBalance: balanceData?.nativeBalance || '0',
            tokenBalances: balanceData?.tokenBalances || [],
          },
          lastUpdated: balanceData?.lastUpdated || new Date().toISOString(),
        },
      },
    }

    console.log(
      `✅ Dashboard stats loaded for merchant: ${merchant.metamaskAddress}`,
    )

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dashboard stats',
      },
      { status: 500 },
    )
  }
}
