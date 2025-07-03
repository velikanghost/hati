import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'
import { HATI_CONFIG } from '@/lib/data/hati-config'

interface TokenBalance {
  token: string
  symbol: string
  amount: string
  decimals: number
  contractAddress?: string
}

interface WalletBalanceData {
  walletId: string
  address: string
  blockchain: string
  nativeBalance: string
  tokenBalances: TokenBalance[]
  totalUsdcBalance: string
  lastUpdated: string
}

interface CircleWalletInfo {
  id: string
  address: string
  blockchain: string
  state: string
  walletSetId: string
  custodyType: string
  createDate: string
  updateDate: string
}

export class CircleWalletService {
  private circleSdk: any
  private readonly SUPPORTED_BLOCKCHAINS = ['EVM']
  private readonly LINEA_USDC_ADDRESS = HATI_CONFIG.MERCHANT_NETWORK.usdc
  private readonly RATE_LIMIT_DELAY = 1000 // 1 second between requests

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

  /**
   * Validate wallet ID format
   */
  private isValidWalletId(walletId: string): boolean {
    // Circle wallet IDs are typically UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(walletId)
  }

  /**
   * Enhanced error handling for Circle API responses
   */
  private handleCircleError(error: any, operation: string): never {
    console.error(`Circle API ${operation} error:`, {
      message: error.message,
      status: error.status || error.response?.status,
      data: error.data || error.response?.data,
      code: error.code,
    })

    if (error.response?.status === 400) {
      throw new Error(`Invalid request to Circle API: ${error.message}`)
    } else if (error.response?.status === 401) {
      throw new Error(
        'Circle API authentication failed. Check your API key and entity secret.',
      )
    } else if (error.response?.status === 404) {
      throw new Error('Wallet not found in Circle API')
    } else if (error.response?.status === 429) {
      throw new Error('Circle API rate limit exceeded. Please try again later.')
    } else {
      throw new Error(`Circle API ${operation} failed: ${error.message}`)
    }
  }

  /**
   * Get detailed wallet information with enhanced error handling
   */
  async getWalletInfo(walletId: string): Promise<CircleWalletInfo> {
    try {
      if (!walletId) {
        throw new Error('Wallet ID is required')
      }

      if (!this.isValidWalletId(walletId)) {
        throw new Error(`Invalid wallet ID format: ${walletId}`)
      }

      await this.rateLimitDelay()

      console.log(`🔍 Getting wallet info for: ${walletId}`)

      const response = await this.circleSdk.getWallet({ id: walletId })

      if (!response || !response.data) {
        throw new Error('Empty response from Circle API')
      }

      if (!response.data.wallet) {
        throw new Error('Wallet not found in response')
      }

      const wallet = response.data.wallet

      console.log(`✅ Wallet info retrieved successfully: ${wallet.address}`)

      return {
        id: wallet.id,
        address: wallet.address,
        blockchain: wallet.blockchain,
        state: wallet.state,
        walletSetId: wallet.walletSetId,
        custodyType: wallet.custodyType,
        createDate: wallet.createDate,
        updateDate: wallet.updateDate,
      }
    } catch (error: any) {
      this.handleCircleError(error, 'getWalletInfo')
    }
  }

  /**
   * Enhanced balance fetching with better error handling and fallback
   */
  async getWalletBalance(walletId: string): Promise<WalletBalanceData> {
    try {
      if (!walletId) {
        throw new Error('Wallet ID is required')
      }

      if (!this.isValidWalletId(walletId)) {
        throw new Error(`Invalid wallet ID format: ${walletId}`)
      }

      await this.rateLimitDelay()

      console.log(`🔍 Getting wallet balance for: ${walletId}`)

      // Try to get wallet info first (lighter call)
      let walletInfo: any
      try {
        const walletResponse = await this.circleSdk.getWallet({ id: walletId })
        if (!walletResponse?.data?.wallet) {
          throw new Error('Wallet not found')
        }
        walletInfo = walletResponse.data.wallet
        console.log(`✅ Wallet exists: ${walletInfo.address}`)
      } catch (error: any) {
        console.error('Failed to get wallet info:', error)
        this.handleCircleError(error, 'getWallet')
      }

      // Try to get token balances
      let tokenBalances: any[] = []
      try {
        await this.rateLimitDelay() // Add delay between calls
        const balanceResponse = await this.circleSdk.getWalletTokenBalance({
          id: walletId,
        })

        if (balanceResponse?.data?.tokenBalances) {
          tokenBalances = balanceResponse.data.tokenBalances
          console.log(
            `✅ Token balances retrieved: ${tokenBalances.length} tokens`,
          )
        } else {
          console.warn('No token balances found in response')
        }
      } catch (error: any) {
        console.error(
          'Failed to get token balances (continuing with empty balances):',
          error,
        )
        // Don't throw here - continue with empty token balances
        tokenBalances = []
      }

      // Process token balances
      const processedTokenBalances: TokenBalance[] = tokenBalances.map(
        (balance: any) => ({
          token: balance.token?.name || 'Unknown',
          symbol: balance.token?.symbol || 'UNKNOWN',
          amount: balance.amount || '0',
          decimals: balance.token?.decimals || 18,
          contractAddress: balance.token?.tokenAddress,
        }),
      )

      // Find USDC balance specifically
      const usdcBalance = processedTokenBalances.find(
        (balance) =>
          balance.symbol === 'USDC' ||
          balance.contractAddress?.toLowerCase() ===
            this.LINEA_USDC_ADDRESS.toLowerCase(),
      )

      const result: WalletBalanceData = {
        walletId,
        address: walletInfo.address,
        blockchain: walletInfo.blockchain,
        nativeBalance: walletInfo.balance || '0',
        tokenBalances: processedTokenBalances,
        totalUsdcBalance: usdcBalance?.amount || '0',
        lastUpdated: new Date().toISOString(),
      }

      console.log(`✅ Balance data compiled for ${walletId}:`, {
        address: result.address,
        nativeBalance: result.nativeBalance,
        tokenCount: result.tokenBalances.length,
        usdcBalance: result.totalUsdcBalance,
      })

      return result
    } catch (error: any) {
      this.handleCircleError(error, 'getWalletBalance')
    }
  }

  /**
   * Get USDC balance specifically (optimized for merchants)
   */
  async getUsdcBalance(walletId: string): Promise<string> {
    try {
      const balanceData = await this.getWalletBalance(walletId)
      return balanceData.totalUsdcBalance
    } catch (error: any) {
      console.error('Error getting USDC balance:', error)
      throw new Error(`Failed to get USDC balance: ${error.message}`)
    }
  }

  /**
   * Create a new Hati wallet for merchants
   */
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
    try {
      await this.rateLimitDelay()

      console.log(
        `🔄 Creating Hati wallet for ${userAddress} with ${cardTier} tier...`,
      )

      // Create wallet set first
      const walletSetResponse = await this.circleSdk.createWalletSet({
        name: `hati-merchant-${userAddress.toLowerCase().slice(0, 8)}`,
      })

      const walletSetId = walletSetResponse.data?.walletSet?.id
      if (!walletSetId) {
        throw new Error('Failed to create wallet set')
      }

      await this.rateLimitDelay()

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
        createdAt: wallet.createDate,
      }
    } catch (error: any) {
      console.error('Error creating merchant wallet:', error)
      this.handleCircleError(error, 'createMerchantWallet')
    }
  }

  /**
   * Sign a transaction
   */
  async signTransaction(
    walletId: string,
    transaction: any,
  ): Promise<{
    signedTransaction: string
    transactionHash?: string
  }> {
    try {
      if (!this.isValidWalletId(walletId)) {
        throw new Error(`Invalid wallet ID format: ${walletId}`)
      }

      await this.rateLimitDelay()

      const response = await this.circleSdk.signTransaction({
        walletId,
        transaction: JSON.stringify(transaction),
      })

      return {
        signedTransaction: response.data?.signedTransaction || '',
        transactionHash: response.data?.transactionHash,
      }
    } catch (error: any) {
      this.handleCircleError(error, 'signTransaction')
    }
  }

  /**
   * Get wallet capabilities and info
   */
  getServiceInfo() {
    return {
      supportedBlockchains: this.SUPPORTED_BLOCKCHAINS,
      primaryNetwork: HATI_CONFIG.MERCHANT_NETWORK,
      features: [
        'Linea-focused merchant wallets using Circle EVM support',
        'USDC-focused payment processing on Linea',
        'EOA wallet generation for receiving payments',
        'Cross-chain payment bridging via LiFi',
        'Enterprise-grade security',
        'Token-specific balance queries',
        'Rate-limited API calls',
      ],
      sdkVersion: '8.3.0',
      network: 'Linea Mainnet (59144)',
      usdcContract: this.LINEA_USDC_ADDRESS,
      apiConfigured: !!(
        process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET
      ),
    }
  }

  /**
   * Test Circle API connectivity
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to list wallet sets (lightweight operation)
      await this.circleSdk.listWalletSets({ pageSize: 1 })
      return {
        success: true,
        message: 'Circle API connection successful',
      }
    } catch (error: any) {
      console.error('Circle API connection test failed:', error)
      return {
        success: false,
        message: `Circle API connection failed: ${error.message}`,
      }
    }
  }

  /**
   * Rate limiting to avoid API throttling
   */
  private async rateLimitDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.RATE_LIMIT_DELAY))
  }

  /**
   * Get human-readable network name
   */
  private getNetworkName(blockchain: string): string {
    if (blockchain === 'EVM') {
      return 'Linea'
    }
    return blockchain
  }

  /**
   * Validate wallet address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }
}

// Export singleton instance
export const circleWalletService = new CircleWalletService()
