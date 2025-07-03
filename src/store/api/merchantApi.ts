import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { MerchantTransactions } from '@/lib/types/all'

// Transform raw API response to our format
const transformOperations = (operations: any[]): MerchantTransactions[] => {
  const getChainNameById = (chainId: string): string | undefined => {
    const networkChainNames: { [key: string]: any } = {
      // Hati Primary Chain (Merchant destination)
      59144: 'Linea', // 0xe708 - Primary network for Hati merchants
      // Bridge Source Chains (User payment origins)
      1: 'Ethereum',
      42161: 'Arbitrum', // 0xa4b1
      8453: 'Base', // 0x2105
      10: 'Optimism', // 0xa
      // Legacy testnet mappings (deprecated)
      10002: 'Sepolia',
      10004: 'BaseSepolia',
      10005: 'OptimismSepolia',
      10003: 'ArbitrumSepolia',
    }
    return networkChainNames[chainId] || undefined
  }

  return operations.map((op: any) => ({
    hash: op.sourceChain?.transaction?.txHash,
    source: op.sourceChain?.chainId,
    destination: op.content?.payload?.toChain,
    destinationFormatted:
      getChainNameById(op.content?.payload?.toChain) || 'Unknown',
    sourceFormatted: getChainNameById(op.sourceChain?.chainId) || 'Unknown',
    protocol: op.content?.standarizedProperties?.appIds[0],
    status: op.targetChain?.status || 'pending',
    amount: op.content?.payload?.amount,
    tokenAddress: op.content?.standarizedProperties?.tokenAddress,
    vaa: op?.vaa,
  }))
}

export const merchantApi = createApi({
  reducerPath: 'merchantApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.wormholescan.io/api/v1/',
  }),
  tagTypes: ['Operations'],
  endpoints: (builder) => ({
    getOperations: builder.query<
      {
        all: MerchantTransactions[]
        pending: MerchantTransactions[]
      },
      string
    >({
      query: (merchantAddress) =>
        `operations?sortOrder=DESC&address=${merchantAddress}`,
      transformResponse: (response: { operations: any[] }) => {
        const allOperations = transformOperations(response.operations || [])
        const pendingOperations = allOperations.filter(
          (op) => op.status !== 'completed',
        )

        return {
          all: allOperations,
          pending: pendingOperations,
        }
      },
      providesTags: ['Operations'],
    }),
  }),
})

export const { useGetOperationsQuery } = merchantApi
