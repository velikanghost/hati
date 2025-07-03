import { NextRequest, NextResponse } from 'next/server'
import {
  ChainId,
  createConfig,
  getRoutes,
  type RoutesRequest,
  type Route as LiFiRoute,
} from '@lifi/sdk'

interface HatiBridgeRequest {
  action: 'getRoutes' | 'executePayment' | 'getStatus'
  fromChainId: number
  toChainId: number
  fromTokenAddress: string
  toTokenAddress: string
  fromAmount: string
  fromAddress: string
  toAddress: string // Merchant's Hati wallet address
  slippage?: number
  route?: LiFiRoute // For execution
  txHash?: string // For status checking
  bridgeTool?: string // For status checking
}

interface PaymentResult {
  success: boolean
  txHash?: string
  route: LiFiRoute
  estimatedTime: number
  actualTime?: number
  status: 'pending' | 'success' | 'failed'
  error?: string
}

class HatiLiFiBridgeAPI {
  private initialized = false
  private readonly integrator = 'hati-metamask-hackathon'

  constructor() {
    this.initializeSDK()
  }

  private initializeSDK() {
    if (this.initialized) return

    try {
      // ✅ Fixed: Use server-side only environment variables
      const infuraApiKey = process.env.INFURA_API_KEY
      if (!infuraApiKey) {
        throw new Error('INFURA_API_KEY not configured')
      }

      createConfig({
        integrator: this.integrator,
        rpcUrls: {
          [ChainId.LNA]: [`https://linea-mainnet.infura.io/v3/${infuraApiKey}`],
          [ChainId.ARB]: [
            `https://arbitrum-mainnet.infura.io/v3/${infuraApiKey}`,
          ],
          [ChainId.OPT]: [
            `https://optimism-mainnet.infura.io/v3/${infuraApiKey}`,
          ],
          [ChainId.BAS]: [`https://base-mainnet.infura.io/v3/${infuraApiKey}`],
        },
        routeOptions: {
          maxPriceImpact: 0.4,
          slippage: 0.03,
        },
      })

      this.initialized = true
      console.log('✅ Hati LiFi SDK initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize LiFi SDK:', error)
      throw error
    }
  }

  async getOptimalHatiRoutes(request: HatiBridgeRequest): Promise<{
    routes: LiFiRoute[]
    bestRoute: LiFiRoute
    estimatedTime: number
  }> {
    try {
      this.initializeSDK()

      if (!request.toChainId || !request.toTokenAddress) {
        throw new Error('Destination chain and token address are required')
      }

      const routeRequest: RoutesRequest = {
        fromChainId: request.fromChainId,
        toChainId: request.toChainId,
        fromTokenAddress: request.fromTokenAddress,
        toTokenAddress: request.toTokenAddress,
        fromAmount: request.fromAmount,
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        options: {
          slippage: request.slippage || 0.03,
          integrator: this.integrator,
          exchanges: {
            allow: ['1inch', 'paraswap', 'uniswap', '0x', 'dodo'],
          },
          order: 'FASTEST',
        },
      }

      console.log(
        `🔄 Getting routes from Chain ${request.fromChainId} to Chain ${request.toChainId}`,
      )

      const result = await getRoutes(routeRequest)

      if (!result.routes || result.routes.length === 0) {
        throw new Error(
          `No routes found from chain ${request.fromChainId} to chain ${request.toChainId}. Please try a different token or amount.`,
        )
      }

      // Sort routes by preference (CCTP first, then by speed)
      const sortedRoutes = this.sortRoutesByHatiPreference(result.routes)
      const bestRoute = sortedRoutes[0]
      const estimatedTime = this.getEstimatedSettlementTime(bestRoute)

      console.log(
        `✅ Found ${sortedRoutes.length} routes, best: ${
          this.routeUsesCCTP(bestRoute) ? 'CCTP' : 'Other'
        } (${estimatedTime}s)`,
      )

      return {
        routes: sortedRoutes,
        bestRoute,
        estimatedTime,
      }
    } catch (error) {
      console.error('❌ Error getting Hati routes:', error)
      throw error
    }
  }

  // Payment execution is now handled client-side with the LiFi SDK
  // This method is deprecated - use the useLiFiBridge hook instead
  async executePayment(route: LiFiRoute): Promise<PaymentResult> {
    console.warn(
      '⚠️ Server-side execution is deprecated. Use client-side execution instead.',
    )

    return {
      success: false,
      route,
      estimatedTime: this.getEstimatedSettlementTime(route),
      status: 'failed',
      error:
        'Payment execution must be done client-side with wallet interaction',
    }
  }

  private sortRoutesByHatiPreference(routes: LiFiRoute[]): LiFiRoute[] {
    return routes.sort((a, b) => {
      // 1. Prioritize CCTP routes for USDC
      const aUsesCCTP = this.routeUsesCCTP(a)
      const bUsesCCTP = this.routeUsesCCTP(b)

      if (aUsesCCTP && !bUsesCCTP) return -1
      if (!aUsesCCTP && bUsesCCTP) return 1

      // 2. Sort by estimated time
      const aTime = this.getEstimatedSettlementTime(a)
      const bTime = this.getEstimatedSettlementTime(b)

      if (aTime !== bTime) return aTime - bTime

      // 3. Sort by gas cost
      const aGasCost = a.steps.reduce(
        (total, step) =>
          total + Number(step.estimate.gasCosts?.[0]?.amount || 0),
        0,
      )
      const bGasCost = b.steps.reduce(
        (total, step) =>
          total + Number(step.estimate.gasCosts?.[0]?.amount || 0),
        0,
      )

      return aGasCost - bGasCost
    })
  }

  private routeUsesCCTP(route: LiFiRoute): boolean {
    return route.steps.some(
      (step) =>
        step.toolDetails.name.toLowerCase().includes('cctp') ||
        step.toolDetails.name.toLowerCase().includes('circle') ||
        step.toolDetails.name.toLowerCase().includes('native-circle'),
    )
  }

  getEstimatedSettlementTime(route: LiFiRoute): number {
    if (this.routeUsesCCTP(route)) {
      return 15 // 8-20 seconds for CCTP
    }

    // Calculate total time for non-CCTP routes
    return route.steps.reduce(
      (total, step) => total + (step.estimate.executionDuration || 30),
      0,
    )
  }

  async checkTransactionStatus(
    txHash: string,
    fromChainId: number,
    toChainId: number,
    bridgeTool: string,
  ): Promise<{
    status: 'pending' | 'success' | 'failed'
    message: string
    details?: any
  }> {
    try {
      // Use real LiFi SDK for status checking
      const { getStatus } = await import('@lifi/sdk')

      const result = await getStatus({
        txHash,
        fromChain: fromChainId,
        toChain: toChainId,
        bridge: bridgeTool,
      })

      // Map LiFi status to our expected format
      let status: 'pending' | 'success' | 'failed'
      let message: string

      switch (result.status) {
        case 'DONE':
          status = 'success'
          message = 'Transaction completed successfully'
          break
        case 'FAILED':
          status = 'failed'
          message = result.substatusMessage || 'Transaction failed'
          break
        case 'PENDING':
        case 'NOT_FOUND':
        default:
          status = 'pending'
          message = result.substatusMessage || 'Transaction pending'
          break
      }

      return {
        status,
        message,
        details: result,
      }
    } catch (error: any) {
      console.error('❌ Failed to check transaction status:', error)
      return {
        status: 'failed',
        message: error.message || 'Failed to check transaction status',
      }
    }
  }
}

const hatiLiFiAPI = new HatiLiFiBridgeAPI()

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { action, ...params } = requestBody

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 },
      )
    }

    const fullRequest = { action, ...params } as HatiBridgeRequest

    switch (action) {
      case 'getRoutes':
        if (
          !fullRequest.fromChainId ||
          !fullRequest.fromTokenAddress ||
          !fullRequest.fromAmount ||
          !fullRequest.fromAddress ||
          !fullRequest.toAddress ||
          !fullRequest.toChainId ||
          !fullRequest.toTokenAddress
        ) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required parameters for route request',
            },
            { status: 400 },
          )
        }

        const routeResult = await hatiLiFiAPI.getOptimalHatiRoutes(fullRequest)

        return NextResponse.json({
          success: true,
          data: {
            ...routeResult,
            message: `Converting via ${
              routeResult.bestRoute.steps.some((step) =>
                step.toolDetails.name.toLowerCase().includes('cctp'),
              )
                ? 'CCTP'
                : 'Bridge'
            }`,
          },
        })

      case 'executePayment':
        if (!fullRequest.route) {
          return NextResponse.json(
            { success: false, error: 'Route required for execution' },
            { status: 400 },
          )
        }

        const paymentResult = await hatiLiFiAPI.executePayment(
          fullRequest.route,
        )

        return NextResponse.json({
          success: paymentResult.success,
          data: paymentResult,
        })

      case 'getStatus':
        if (
          !fullRequest.txHash ||
          !fullRequest.fromChainId ||
          !fullRequest.toChainId
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Transaction hash, source chain, and destination chain are required',
            },
            { status: 400 },
          )
        }

        const status = await hatiLiFiAPI.checkTransactionStatus(
          fullRequest.txHash,
          fullRequest.fromChainId,
          fullRequest.toChainId,
          fullRequest.bridgeTool || 'unknown',
        )

        return NextResponse.json({
          success: true,
          data: status,
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 },
        )
    }
  } catch (error: any) {
    console.error('🔥 Hati Bridge API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Payment processing failed',
        details: 'Please try again or contact support if the issue persists',
      },
      { status: 500 },
    )
  }
}
