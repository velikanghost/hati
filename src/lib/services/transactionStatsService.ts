import { db } from '@/lib/database'

interface TransactionStats {
  totalPayments: number
  totalVolume: number
  monthlyGrowth: number
  yieldEarned: number
  avgTransactionTime: number
  successRate: number
  thisMonthVolume: number
  lastMonthVolume: number
}

interface RecentTransaction {
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
}

export class TransactionStatsService {
  /**
   * Get comprehensive transaction statistics for a merchant
   */
  async getMerchantStats(merchantAddress: string): Promise<TransactionStats> {
    try {
      // Get date ranges for month-over-month comparison
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      // Parallel queries for better performance
      const [
        totalTransactions,
        thisMonthTransactions,
        lastMonthTransactions,
        avgBridgeTime,
        successStats,
      ] = await Promise.all([
        // Total all-time transactions
        db.merchantTransaction.findMany({
          where: { merchantAddress },
          select: { id: true, usdValue: true, amount: true },
        }),

        // This month transactions
        db.merchantTransaction.findMany({
          where: {
            merchantAddress,
            createdAt: { gte: thisMonthStart },
          },
          select: { id: true, usdValue: true, amount: true },
        }),

        // Last month transactions
        db.merchantTransaction.findMany({
          where: {
            merchantAddress,
            createdAt: {
              gte: lastMonthStart,
              lte: lastMonthEnd,
            },
          },
          select: { id: true, usdValue: true, amount: true },
        }),

        // Average bridge time for completed transactions
        db.merchantTransaction.aggregate({
          where: {
            merchantAddress,
            status: 'COMPLETED',
            bridgeTime: { not: null },
          },
          _avg: { bridgeTime: true },
        }),

        // Success rate calculation
        db.merchantTransaction.groupBy({
          by: ['status'],
          where: { merchantAddress },
          _count: { status: true },
        }),
      ])

      // Calculate totals
      const totalPayments = totalTransactions.length
      const totalVolume = totalTransactions.reduce((sum, tx) => {
        const value = parseFloat(tx.usdValue || tx.amount || '0')
        return sum + value
      }, 0)

      const thisMonthVolume = thisMonthTransactions.reduce((sum, tx) => {
        const value = parseFloat(tx.usdValue || tx.amount || '0')
        return sum + value
      }, 0)

      const lastMonthVolume = lastMonthTransactions.reduce((sum, tx) => {
        const value = parseFloat(tx.usdValue || tx.amount || '0')
        return sum + value
      }, 0)

      // Calculate monthly growth
      let monthlyGrowth = 0
      if (lastMonthVolume > 0) {
        monthlyGrowth =
          ((thisMonthVolume - lastMonthVolume) / lastMonthVolume) * 100
      } else if (thisMonthVolume > 0) {
        monthlyGrowth = 100 // First month with activity
      }

      // Calculate success rate
      const totalTxCount = successStats.reduce(
        (sum, stat) => sum + stat._count.status,
        0,
      )
      const completedTransactions =
        successStats.find((stat) => stat.status === 'COMPLETED')?._count
          .status || 0
      const successRate =
        totalTxCount > 0 ? (completedTransactions / totalTxCount) * 100 : 100

      // Average transaction time (bridge time)
      const avgTransactionTime = avgBridgeTime._avg.bridgeTime || 15 // Default to 15 seconds

      // Mock yield earned - in production, this would come from DeFi protocol integrations
      const yieldEarned = totalVolume * 0.045 * (1 / 12) // 4.5% APY, prorated for time

      return {
        totalPayments,
        totalVolume,
        monthlyGrowth,
        yieldEarned,
        avgTransactionTime,
        successRate,
        thisMonthVolume,
        lastMonthVolume,
      }
    } catch (error) {
      console.error('Error calculating merchant stats:', error)
      throw new Error('Failed to calculate merchant statistics')
    }
  }

  /**
   * Get recent transactions for a merchant
   */
  async getRecentTransactions(
    merchantAddress: string,
    limit: number = 10,
  ): Promise<RecentTransaction[]> {
    try {
      const transactions = await db.merchantTransaction.findMany({
        where: { merchantAddress },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      return transactions.map((tx) => ({
        id: tx.id,
        transactionHash: tx.transactionHash,
        sourceChain: tx.sourceChain,
        destinationChain: tx.destinationChain,
        amount: tx.amount,
        usdValue: tx.usdValue,
        status: tx.status,
        protocol: tx.protocol,
        bridgeTime: tx.bridgeTime,
        createdAt: tx.createdAt.toISOString(),
        from: this.truncateAddress(tx.transactionHash), // Use first part of tx hash as "from"
      }))
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
      throw new Error('Failed to fetch recent transactions')
    }
  }

  /**
   * Get paginated transaction history
   */
  async getTransactionHistory(
    merchantAddress: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{
    transactions: RecentTransaction[]
    totalCount: number
    currentPage: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }> {
    try {
      const offset = (page - 1) * limit
      const whereClause: any = { merchantAddress }

      if (status && status !== 'all') {
        whereClause.status = status.toUpperCase()
      }

      const [transactions, totalCount] = await Promise.all([
        db.merchantTransaction.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        db.merchantTransaction.count({
          where: whereClause,
        }),
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          transactionHash: tx.transactionHash,
          sourceChain: tx.sourceChain,
          destinationChain: tx.destinationChain,
          amount: tx.amount,
          usdValue: tx.usdValue,
          status: tx.status,
          protocol: tx.protocol,
          bridgeTime: tx.bridgeTime,
          createdAt: tx.createdAt.toISOString(),
          from: this.truncateAddress(tx.transactionHash),
        })),
        totalCount,
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      throw new Error('Failed to fetch transaction history')
    }
  }

  /**
   * Add a new transaction record
   */
  async addTransaction(transactionData: {
    merchantAddress: string
    transactionHash: string
    sourceChain: string
    destinationChain: string
    sourceToken: string
    destinationToken: string
    amount: string
    usdValue?: string
    protocol?: string
    bridgeTime?: number
  }): Promise<void> {
    try {
      await db.merchantTransaction.create({
        data: {
          ...transactionData,
          status: 'PENDING',
        },
      })

      console.log(`✅ Transaction recorded: ${transactionData.transactionHash}`)
    } catch (error) {
      console.error('Error adding transaction:', error)
      throw new Error('Failed to record transaction')
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionHash: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
    bridgeTime?: number,
  ): Promise<void> {
    try {
      const updateData: any = { status }
      if (bridgeTime) {
        updateData.bridgeTime = bridgeTime
      }

      await db.merchantTransaction.update({
        where: { transactionHash },
        data: updateData,
      })

      console.log(
        `✅ Transaction status updated: ${transactionHash} -> ${status}`,
      )
    } catch (error) {
      console.error('Error updating transaction status:', error)
      throw new Error('Failed to update transaction status')
    }
  }

  /**
   * Get transaction analytics for dashboard
   */
  async getTransactionAnalytics(
    merchantAddress: string,
    days: number = 30,
  ): Promise<{
    dailyVolume: Array<{ date: string; volume: number; count: number }>
    chainDistribution: Array<{
      chain: string
      volume: number
      percentage: number
    }>
    statusDistribution: Array<{
      status: string
      count: number
      percentage: number
    }>
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get all transactions for analysis
      const [recentTxs, allTxs] = await Promise.all([
        db.merchantTransaction.findMany({
          where: {
            merchantAddress,
            createdAt: { gte: startDate },
          },
          select: { createdAt: true, usdValue: true, amount: true },
        }),
        db.merchantTransaction.findMany({
          where: { merchantAddress },
          select: {
            sourceChain: true,
            status: true,
            usdValue: true,
            amount: true,
          },
        }),
      ])

      // Process daily volume
      const dailyVolumeMap = new Map<
        string,
        { volume: number; count: number }
      >()
      recentTxs.forEach((tx) => {
        const date = tx.createdAt.toISOString().split('T')[0]
        const volume = parseFloat(tx.usdValue || tx.amount || '0')
        const existing = dailyVolumeMap.get(date) || { volume: 0, count: 0 }
        dailyVolumeMap.set(date, {
          volume: existing.volume + volume,
          count: existing.count + 1,
        })
      })

      const dailyVolume = Array.from(dailyVolumeMap.entries()).map(
        ([date, data]) => ({
          date,
          volume: data.volume,
          count: data.count,
        }),
      )

      // Process chain distribution
      const chainVolumeMap = new Map<string, number>()
      allTxs.forEach((tx) => {
        const volume = parseFloat(tx.usdValue || tx.amount || '0')
        const existing = chainVolumeMap.get(tx.sourceChain) || 0
        chainVolumeMap.set(tx.sourceChain, existing + volume)
      })

      const totalChainVolume = Array.from(chainVolumeMap.values()).reduce(
        (sum, vol) => sum + vol,
        0,
      )
      const chainDistribution = Array.from(chainVolumeMap.entries()).map(
        ([chain, volume]) => ({
          chain,
          volume,
          percentage:
            totalChainVolume > 0 ? (volume / totalChainVolume) * 100 : 0,
        }),
      )

      // Process status distribution
      const statusCountMap = new Map<string, number>()
      allTxs.forEach((tx) => {
        const existing = statusCountMap.get(tx.status) || 0
        statusCountMap.set(tx.status, existing + 1)
      })

      const totalStatusCount = Array.from(statusCountMap.values()).reduce(
        (sum, count) => sum + count,
        0,
      )
      const statusDistribution = Array.from(statusCountMap.entries()).map(
        ([status, count]) => ({
          status,
          count,
          percentage:
            totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0,
        }),
      )

      return {
        dailyVolume,
        chainDistribution,
        statusDistribution,
      }
    } catch (error) {
      console.error('Error getting transaction analytics:', error)
      throw new Error('Failed to get transaction analytics')
    }
  }

  /**
   * Helper function to truncate addresses for display
   */
  private truncateAddress(address: string): string {
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
}

// Export singleton instance
export const transactionStatsService = new TransactionStatsService()
