import { NextRequest, NextResponse } from 'next/server'

interface OptimizeRequest {
  action: 'check-balance' | 'optimize' | 'get-yield-info'
  walletId: string
  merchantAddress: string
  sessionToken?: string
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive'
}

interface YieldProtocol {
  name: string
  apy: number
  tvl: number
  riskLevel: 'low' | 'medium' | 'high'
  contractAddress: string
  network: 'linea'
}

interface OptimizationResult {
  totalAmount: number
  allocations: {
    protocol: string
    amount: number
    apy: number
    txHash?: string
  }[]
  estimatedAnnualYield: number
  status: 'pending' | 'success' | 'failed'
}

class SmartLiquidityAgent {
  private readonly MINIMUM_BALANCE = 200 // 200 USDC threshold

  // Mock DeFi protocols on Linea (replace with real integrations)
  private readonly YIELD_PROTOCOLS: YieldProtocol[] = [
    {
      name: 'Aave V3 Linea',
      apy: 4.5,
      tvl: 50000000,
      riskLevel: 'low',
      contractAddress: '0x...', // Real Aave V3 Linea pool
      network: 'linea',
    },
    {
      name: 'Compound Linea',
      apy: 3.8,
      tvl: 25000000,
      riskLevel: 'low',
      contractAddress: '0x...', // Real Compound Linea pool
      network: 'linea',
    },
    {
      name: 'Yearn Finance Linea',
      apy: 6.2,
      tvl: 15000000,
      riskLevel: 'medium',
      contractAddress: '0x...', // Real Yearn vault
      network: 'linea',
    },
  ]

  async checkWalletBalance(
    walletId: string,
  ): Promise<{ balance: number; eligible: boolean }> {
    try {
      // Call Circle API to get wallet balance
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        }/api/circle/wallet`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getBalance',
            walletId,
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Balance check failed')
      }

      const balance = result.data.usdcBalance || 0
      const eligible = balance >= this.MINIMUM_BALANCE

      return { balance, eligible }
    } catch (error) {
      console.error('Error checking wallet balance:', error)
      throw error
    }
  }

  calculateOptimalAllocation(
    totalAmount: number,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate',
  ): { protocol: string; amount: number; apy: number }[] {
    // Sort protocols by APY
    const sortedProtocols = [...this.YIELD_PROTOCOLS].sort(
      (a, b) => b.apy - a.apy,
    )

    switch (riskTolerance) {
      case 'conservative':
        // 100% to lowest risk (Aave)
        const aaveProtocol = sortedProtocols.find((p) =>
          p.name.includes('Aave'),
        )!
        return [
          {
            protocol: aaveProtocol.name,
            amount: totalAmount,
            apy: aaveProtocol.apy,
          },
        ]

      case 'moderate':
        // 60% Aave, 40% Compound
        const aave = sortedProtocols.find((p) => p.name.includes('Aave'))!
        const compound = sortedProtocols.find((p) =>
          p.name.includes('Compound'),
        )!
        return [
          {
            protocol: aave.name,
            amount: totalAmount * 0.6,
            apy: aave.apy,
          },
          {
            protocol: compound.name,
            amount: totalAmount * 0.4,
            apy: compound.apy,
          },
        ]

      case 'aggressive':
        // Split across all protocols for diversification
        const perProtocol = totalAmount / this.YIELD_PROTOCOLS.length
        return this.YIELD_PROTOCOLS.map((protocol) => ({
          protocol: protocol.name,
          amount: perProtocol,
          apy: protocol.apy,
        }))

      default:
        return []
    }
  }

  async executeOptimization(
    walletId: string,
    allocation: { protocol: string; amount: number; apy: number }[],
  ): Promise<OptimizationResult> {
    const results: OptimizationResult = {
      totalAmount: allocation.reduce((sum, a) => sum + a.amount, 0),
      allocations: [],
      estimatedAnnualYield: 0,
      status: 'pending',
    }

    try {
      // Execute deposits to each protocol
      for (const alloc of allocation) {
        try {
          // For demo purposes, simulate successful transactions
          // In production, this would:
          // 1. Create transaction to deposit USDC to DeFi protocol
          // 2. Sign with Circle wallet
          // 3. Execute on Linea

          const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

          results.allocations.push({
            protocol: alloc.protocol,
            amount: alloc.amount,
            apy: alloc.apy,
            txHash: mockTxHash,
          })

          console.log(`✅ Deposited ${alloc.amount} USDC to ${alloc.protocol}`)

          // Simulate delay
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`❌ Failed to deposit to ${alloc.protocol}:`, error)
          results.status = 'failed'
          return results
        }
      }

      // Calculate weighted APY
      results.estimatedAnnualYield = allocation.reduce((sum, alloc) => {
        const weight = alloc.amount / results.totalAmount
        return sum + alloc.apy * weight
      }, 0)

      results.status = 'success'

      console.log(
        `🎯 Smart Liquidity optimization complete: ${results.estimatedAnnualYield.toFixed(
          2,
        )}% APY`,
      )

      return results
    } catch (error) {
      console.error('Error executing optimization:', error)
      results.status = 'failed'
      return results
    }
  }

  getYieldInfo(): YieldProtocol[] {
    return this.YIELD_PROTOCOLS
  }
}

const liquidityAgent = new SmartLiquidityAgent()

export async function POST(request: NextRequest) {
  try {
    const { action, walletId, merchantAddress, sessionToken, riskTolerance } =
      (await request.json()) as OptimizeRequest

    switch (action) {
      case 'check-balance':
        if (!walletId) {
          return NextResponse.json(
            { success: false, error: 'Wallet ID required' },
            { status: 400 },
          )
        }

        const balanceInfo = await liquidityAgent.checkWalletBalance(walletId)

        return NextResponse.json({
          success: true,
          data: {
            balance: balanceInfo.balance,
            eligible: balanceInfo.eligible,
            threshold: 200,
            message: balanceInfo.eligible
              ? 'Eligible for yield optimization'
              : `Need ${
                  200 - balanceInfo.balance
                } more USDC to enable optimization`,
          },
        })

      case 'optimize':
        if (!walletId || !merchantAddress) {
          return NextResponse.json(
            {
              success: false,
              error: 'Wallet ID and merchant address required',
            },
            { status: 400 },
          )
        }

        // Check balance first
        const { balance, eligible } = await liquidityAgent.checkWalletBalance(
          walletId,
        )

        if (!eligible) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient balance. Need ${200 - balance} more USDC`,
            },
            { status: 400 },
          )
        }

        // Calculate optimal allocation
        const allocation = liquidityAgent.calculateOptimalAllocation(
          balance,
          riskTolerance || 'moderate',
        )

        // Execute optimization
        const result = await liquidityAgent.executeOptimization(
          walletId,
          allocation,
        )

        return NextResponse.json({
          success: true,
          data: {
            optimization: result,
            merchantAddress,
            timestamp: new Date().toISOString(),
          },
        })

      case 'get-yield-info':
        const protocols = liquidityAgent.getYieldInfo()

        return NextResponse.json({
          success: true,
          data: {
            protocols,
            minimumBalance: 200,
            supportedNetwork: 'linea',
          },
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 },
        )
    }
  } catch (error: any) {
    console.error('Smart Liquidity Agent error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
