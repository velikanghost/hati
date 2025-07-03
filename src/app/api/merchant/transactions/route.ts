import { NextRequest, NextResponse } from 'next/server'
import { transactionStatsService } from '@/lib/services/transactionStatsService'
import { db } from '@/lib/database'

interface TransactionsResponse {
  success: boolean
  data?: {
    transactions: Array<{
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
    totalCount: number
    currentPage: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  error?: string
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<TransactionsResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const sessionToken = searchParams.get('sessionToken')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all'

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid pagination parameters. Page must be >= 1, limit must be 1-100',
        },
        { status: 400 },
      )
    }

    // Validate session token and get merchant address
    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionToken is required',
        },
        { status: 400 },
      )
    }

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

    // Get transaction history using the service
    const transactionHistory =
      await transactionStatsService.getTransactionHistory(
        session.merchant.metamaskAddress,
        page,
        limit,
        status,
      )

    return NextResponse.json({
      success: true,
      data: transactionHistory,
    })
  } catch (error: any) {
    console.error('Transactions API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transactions',
      },
      { status: 500 },
    )
  }
}
