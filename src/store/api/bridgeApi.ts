import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Types
export interface BridgeRoute {
  id: string
  fromAmount: string
  toAmount: string
  toToken: {
    symbol: string
  }
  steps: Array<{
    toolDetails: {
      name: string
    }
    estimate: {
      executionDuration?: number
    }
  }>
}

export interface BridgeQuote {
  routes: BridgeRoute[]
  bestRoute: BridgeRoute
  estimatedTime: number
}

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

interface ExecuteRequest {
  route: BridgeRoute
  userAddress: string
}

interface BridgeExecutionResult {
  success: boolean
  txHash: string
  estimatedTime: number
}

export const bridgeApi = createApi({
  reducerPath: 'bridgeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/lifi/',
  }),
  tagTypes: ['Routes', 'Execution'],
  endpoints: (builder) => ({
    getRoutes: builder.query<BridgeQuote, BridgeRequest>({
      query: (request) => ({
        url: 'bridge',
        method: 'POST',
        body: {
          action: 'getRoutes',
          ...request,
        },
      }),
      transformResponse: (response: {
        success: boolean
        data: BridgeQuote
        error?: string
      }) => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to get routes')
        }
        return response.data
      },
      providesTags: ['Routes'],
    }),

    executeBridge: builder.mutation<BridgeExecutionResult, ExecuteRequest>({
      query: ({ route, userAddress }) => ({
        url: 'bridge',
        method: 'POST',
        body: {
          action: 'execute',
          route,
          userAddress,
        },
      }),
      transformResponse: (response: {
        success: boolean
        data: BridgeExecutionResult
        error?: string
      }) => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to execute bridge')
        }
        return response.data
      },
      invalidatesTags: ['Routes'],
    }),

    getStatus: builder.query<{ status: string; txHash?: string }, string>({
      query: (routeId) => ({
        url: 'bridge',
        method: 'POST',
        body: {
          action: 'getStatus',
          routeId,
        },
      }),
      transformResponse: (response: {
        success: boolean
        data: any
        error?: string
      }) => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to get status')
        }
        return response.data
      },
    }),
  }),
})

export const {
  useGetRoutesQuery,
  useLazyGetRoutesQuery,
  useExecuteBridgeMutation,
  useGetStatusQuery,
  useLazyGetStatusQuery,
} = bridgeApi
