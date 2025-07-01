import { NextRequest, NextResponse } from 'next/server'
import {
  ChainId,
  createConfig,
  getRoutes,
  type RoutesRequest,
  type Route as LiFiRoute,
} from '@lifi/sdk'

interface BridgeRequest {
  fromChain: number
  toChain: number
  fromToken: string
  toToken?: string
  fromAmount: string
  fromAddress: string
  toAddress: string
  slippage?: number
}

class LiFiBridgeAPI {
  private initialized = false
  private readonly integrator = 'hati-metamask-hackathon'

  constructor() {
    this.initializeSDK()
  }

  private initializeSDK() {
    if (this.initialized) return

    try {
      createConfig({
        integrator: this.integrator,
        rpcUrls: {
          [ChainId.LNA]: [
            `https://linea-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
          ],
          [ChainId.ARB]: [
            `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
          ],
          [ChainId.OPT]: [
            `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
          ],
        },
        routeOptions: {
          maxPriceImpact: 0.4,
          slippage: 0.03,
        },
      })

      this.initialized = true
      console.log('LiFi SDK initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LiFi SDK:', error)
      throw error
    }
  }

  async getOptimalRoutes(request: BridgeRequest): Promise<LiFiRoute[]> {
    try {
      this.initializeSDK()

      const routeRequest: RoutesRequest = {
        fromChainId: request.fromChain,
        toChainId: request.toChain,
        fromTokenAddress: request.fromToken,
        toTokenAddress:
          request.toToken || '0xA0b86a33E6441bF99CF45c5c0Ad7b6D7e00E7D8D', // Default USDC
        fromAmount: request.fromAmount,
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        options: {
          slippage: request.slippage || 0.03,
          integrator: this.integrator,
          bridges: {
            allow: ['cctp', 'across', 'stargate', 'hop'],
            prefer: ['cctp'], // Prefer CCTP for USDC
          },
          exchanges: {
            allow: ['1inch', 'paraswap', 'uniswap', '0x'],
          },
          order: 'FASTEST',
        },
      }

      const result = await getRoutes(routeRequest)

      if (!result.routes || result.routes.length === 0) {
        throw new Error('No routes found for the given parameters')
      }

      // Sort routes to prioritize CCTP
      return this.sortRoutesByPreference(result.routes)
    } catch (error) {
      console.error('Error getting routes:', error)
      throw error
    }
  }

  private sortRoutesByPreference(routes: LiFiRoute[]): LiFiRoute[] {
    return routes.sort((a, b) => {
      const aUsesCCTP = this.routeUsesCCTP(a)
      const bUsesCCTP = this.routeUsesCCTP(b)

      if (aUsesCCTP && !bUsesCCTP) return -1
      if (!aUsesCCTP && bUsesCCTP) return 1

      // Sort by estimated time
      const aTime = a.steps.reduce(
        (total, step) => total + (step.estimate.executionDuration || 0),
        0,
      )
      const bTime = b.steps.reduce(
        (total, step) => total + (step.estimate.executionDuration || 0),
        0,
      )

      return aTime - bTime
    })
  }

  private routeUsesCCTP(route: LiFiRoute): boolean {
    return route.steps.some(
      (step) =>
        step.toolDetails.name.toLowerCase().includes('cctp') ||
        step.toolDetails.name.toLowerCase().includes('circle'),
    )
  }

  getEstimatedSettlementTime(route: LiFiRoute): number {
    if (this.routeUsesCCTP(route)) {
      return 15 // 8-20 seconds for CCTP
    }

    return route.steps.reduce(
      (total, step) => total + (step.estimate.executionDuration || 30),
      0,
    )
  }
}

const lifiAPI = new LiFiBridgeAPI()

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'getRoutes':
        const routes = await lifiAPI.getOptimalRoutes(params as BridgeRequest)
        return NextResponse.json({
          success: true,
          data: {
            routes,
            bestRoute: routes[0],
            estimatedTime: lifiAPI.getEstimatedSettlementTime(routes[0]),
          },
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 },
        )
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
