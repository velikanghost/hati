'use client'

import { useCallback } from 'react'
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

export const useLiFiBridge = () => {
  const dispatch = useAppDispatch()
  const bridgeState = useAppSelector((state) => state.bridge)

  // RTK Query hooks
  const [getRoutesQuery] = useLazyGetRoutesQuery()
  const [executeBridgeMutation] = useExecuteBridgeMutation()
  const [getStatusQuery] = useLazyGetStatusQuery()

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
  }
}
