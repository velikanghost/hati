'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  useLazyGetRoutesQuery,
  useExecuteBridgeMutation,
  useLazyGetStatusQuery,
  BridgeRoute,
} from '@/store/api/bridgeApi'
import {
  setCurrentQuote,
  setSelectedRoute,
  setIsLoadingRoutes,
  setRouteError,
  setBridgeInProgress,
  setBridgeError,
  setCurrentTxHash,
  setBridgeComplete,
  setRouteId,
  setExecutionStatus,
  setEstimatedCompletionTime,
  resetBridgeState,
  resetExecutionState,
} from '@/store/slices/bridgeSlice'
import {
  createConfig,
  EVM,
  executeRoute,
  type Route as LiFiRoute,
  type RouteExtended,
  getStepTransaction,
  getStatus,
} from '@lifi/sdk'
import { createWalletClient, custom } from 'viem'
import { useMetaMask } from './useMetaMask'
import { initializeLiFiSDK } from '@/lib/lifi'

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

interface LiFiExecutionResult {
  success: boolean
  txHash?: string
  route?: LiFiRoute
  error?: string
}

interface LiFiExecutionOptions {
  onProgress?: (route: RouteExtended) => void
  onSuccess?: (result: LiFiExecutionResult) => void
  onError?: (error: string) => void
}

export const useLiFiBridge = () => {
  const dispatch = useAppDispatch()
  const bridgeState = useAppSelector((state) => state.bridge)

  // RTK Query hooks
  const [getRoutesQuery] = useLazyGetRoutesQuery()
  const [executeBridgeMutation] = useExecuteBridgeMutation()
  const [getStatusQuery] = useLazyGetStatusQuery()

  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] =
    useState<LiFiExecutionResult | null>(null)
  const [sdkConfigured, setSdkConfigured] = useState(false)

  const { account, sdk } = useMetaMask()

  // Initialize LiFi SDK with EVM provider
  useEffect(() => {
    console.log('🔍 LiFi SDK initialization check:', {
      hasSdk: !!sdk,
      hasAccount: !!account,
      sdkConfigured,
      accountAddress: account?.address,
      provider: !!sdk?.getProvider(),
    })

    if (!sdk || !account || sdkConfigured) {
      console.log('⏳ Waiting for dependencies...', {
        missingSdk: !sdk,
        missingAccount: !account,
        alreadyConfigured: sdkConfigured,
      })
      return
    }

    try {
      const provider = sdk.getProvider()
      if (!provider) {
        console.error('❌ No provider available from MetaMask SDK')
        return
      }

      const success = initializeLiFiSDK(provider, account.address)
      if (success) {
        setSdkConfigured(true)
        console.log('✅ LiFi SDK configured successfully')
      } else {
        console.error('❌ LiFi SDK configuration failed')
      }
    } catch (error) {
      console.error('❌ Error during LiFi SDK initialization:', error)
    }
  }, [sdk, account, sdkConfigured])

  const getRoutes = useCallback(
    async (request: BridgeRequest) => {
      dispatch(setIsLoadingRoutes(true))
      dispatch(setRouteError(null))

      try {
        const result = await getRoutesQuery(request).unwrap()
        dispatch(setCurrentQuote(result))
        return result
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to get routes'
        dispatch(setRouteError(errorMessage))
        throw new Error(errorMessage)
      } finally {
        dispatch(setIsLoadingRoutes(false))
      }
    },
    [dispatch, getRoutesQuery],
  )

  const executeBridge = useCallback(
    async (route: BridgeRoute, userAddress: string) => {
      dispatch(setBridgeInProgress(true))
      dispatch(setBridgeError(null))
      dispatch(setRouteId(route.id))

      try {
        const result = await executeBridgeMutation({
          route,
          userAddress,
        }).unwrap()

        dispatch(setCurrentTxHash(result.txHash))
        dispatch(setEstimatedCompletionTime(result.estimatedTime))
        dispatch(setExecutionStatus('pending'))

        return result
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to execute bridge'
        dispatch(setBridgeError(errorMessage))
        dispatch(setExecutionStatus('failed'))
        throw new Error(errorMessage)
      } finally {
        dispatch(setBridgeInProgress(false))
      }
    },
    [dispatch, executeBridgeMutation],
  )

  const bridgeTokens = useCallback(
    async (request: BridgeRequest, userAddress: string) => {
      try {
        // Get routes first
        const routeData = await getRoutes(request)

        if (!routeData.bestRoute) {
          throw new Error('No routes available')
        }

        // Execute the best route
        return await executeBridge(routeData.bestRoute, userAddress)
      } catch (err: any) {
        dispatch(setBridgeError(err.message))
        throw err
      }
    },
    [getRoutes, executeBridge, dispatch],
  )

  const checkBridgeStatus = useCallback(
    async (routeId: string) => {
      try {
        const result = await getStatusQuery(routeId).unwrap()

        if (result.status === 'completed') {
          dispatch(setBridgeComplete(true))
          dispatch(setExecutionStatus('completed'))
          if (result.txHash) {
            dispatch(setCurrentTxHash(result.txHash))
          }
        } else if (result.status === 'failed') {
          dispatch(setExecutionStatus('failed'))
          dispatch(setBridgeError('Bridge transaction failed'))
        }

        return result
      } catch (err: any) {
        dispatch(setBridgeError(err.message || 'Failed to check status'))
        throw err
      }
    },
    [dispatch, getStatusQuery],
  )

  const selectRoute = useCallback(
    (route: BridgeRoute) => {
      dispatch(setSelectedRoute(route))
    },
    [dispatch],
  )

  const isRouteCCTP = useCallback((route: BridgeRoute) => {
    return route.steps.some(
      (step) =>
        step.toolDetails.name.toLowerCase().includes('cctp') ||
        step.toolDetails.name.toLowerCase().includes('circle'),
    )
  }, [])

  const getEstimatedTime = useCallback(
    (route: BridgeRoute) => {
      if (isRouteCCTP(route)) {
        return 15 // 8-20 seconds for CCTP
      }

      return route.steps.reduce(
        (total, step) => total + (step.estimate.executionDuration || 30),
        0,
      )
    },
    [isRouteCCTP],
  )

  const resetState = useCallback(() => {
    dispatch(resetBridgeState())
  }, [dispatch])

  const resetExecutionOnly = useCallback(() => {
    dispatch(resetExecutionState())
  }, [dispatch])

  const executePayment = useCallback(
    async (
      route: LiFiRoute,
      options?: LiFiExecutionOptions,
    ): Promise<LiFiExecutionResult> => {
      if (!sdkConfigured) {
        const error = 'LiFi SDK not configured'
        options?.onError?.(error)
        return { success: false, error }
      }

      if (!account) {
        const error = 'Wallet not connected'
        options?.onError?.(error)
        return { success: false, error }
      }

      setIsExecuting(true)
      setExecutionResult(null)

      try {
        console.log('🚀 Starting LiFi route execution...')

        const executedRoute = await executeRoute(route, {
          updateRouteHook: (updatedRoute) => {
            console.log('📈 Route update:', {
              status: updatedRoute.steps.map((step) => ({
                status: step.execution?.status,
                txHash: step.execution?.process?.find((p) => p.txHash)?.txHash,
              })),
            })

            options?.onProgress?.(updatedRoute)
          },

          acceptExchangeRateUpdateHook: async (params: any) => {
            console.log('💱 Exchange rate changed:', params)

            // For now, auto-accept all changes
            console.log('✅ Auto-accepting rate change')
            return true
          },
        })

        // Extract transaction hash from the executed route
        const txHash = executedRoute.steps
          .flatMap((step) => step.execution?.process || [])
          .find((process) => process.txHash)?.txHash

        const result: LiFiExecutionResult = {
          success: true,
          txHash,
          route: executedRoute,
        }

        console.log('✅ LiFi execution completed successfully:', result)

        setExecutionResult(result)
        options?.onSuccess?.(result)

        return result
      } catch (error: any) {
        console.error('❌ LiFi execution failed:', error)

        const result: LiFiExecutionResult = {
          success: false,
          error: error.message || 'Payment execution failed',
          route,
        }

        setExecutionResult(result)
        options?.onError?.(result.error!)

        return result
      } finally {
        setIsExecuting(false)
      }
    },
    [sdkConfigured, account],
  )

  // Helper function to get transaction status
  const getTransactionStatus = useCallback(
    async (
      txHash: string,
      fromChainId: number,
      toChainId: number,
      bridgeTool: string,
    ) => {
      try {
        const status = await getStatus({
          txHash,
          fromChain: fromChainId,
          toChain: toChainId,
          bridge: bridgeTool,
        })

        return status
      } catch (error) {
        console.error('Failed to get transaction status:', error)
        throw error
      }
    },
    [],
  )

  return {
    // State from Redux
    ...bridgeState,

    // Computed state
    loading: bridgeState.isLoadingRoutes,
    error: bridgeState.routeError || bridgeState.bridgeError,
    quote: bridgeState.currentQuote,
    bridgeInProgress: bridgeState.isBridgeInProgress,

    // Actions
    getRoutes,
    executeBridge,
    bridgeTokens,
    checkBridgeStatus,
    selectRoute,

    // Utilities
    isRouteCCTP,
    getEstimatedTime,
    resetState,
    resetExecutionOnly,

    // New state
    isExecuting,
    executionResult,
    sdkConfigured,

    // New actions
    executePayment,
    getTransactionStatus,

    // Reset function
    reset: () => {
      setExecutionResult(null)
      setIsExecuting(false)
    },
  }
}
