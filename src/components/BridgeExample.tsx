import React from 'react'
import { useLiFiBridge } from '@/hooks/useLiFiBridge'
import { useAppSelector } from '@/store/hooks'
import { Button } from '@/components/ui/button'

interface BridgeExampleProps {
  userAddress: string
}

export const BridgeExample: React.FC<BridgeExampleProps> = ({
  userAddress,
}) => {
  const {
    // State from Redux
    loading,
    error,
    quote,
    bridgeInProgress,
    currentTxHash,
    bridgeComplete,
    executionStatus,

    // Actions
    getRoutes,
    executeBridge,
    bridgeTokens,
    checkBridgeStatus,
    selectRoute,
    resetState,
  } = useLiFiBridge()

  // Access bridge state from Redux store
  const bridgeState = useAppSelector((state) => state.bridge)

  const handleGetRoutes = async () => {
    try {
      await getRoutes({
        fromChain: 1, // Ethereum
        toChain: 42161, // Arbitrum
        fromToken: '0xA0b86a33E6441036C094eAC4e89BC2Db32B09c1b', // USDC
        toToken: 'USDC',
        fromAmount: '1000000', // 1 USDC (6 decimals)
        fromAddress: userAddress,
        toAddress: '0x0cf76957AF81329917E7c29f8cbf9b8FAd7842ce', // merchant address
        slippage: 0.5,
      })
    } catch (error) {
      console.error('Failed to get routes:', error)
    }
  }

  const handleExecuteBridge = async () => {
    if (!quote?.bestRoute) {
      console.error('No route selected')
      return
    }

    try {
      const result = await executeBridge(quote.bestRoute, userAddress)
      console.log('Bridge execution started:', result)

      // Start polling for status updates
      if (result.txHash) {
        pollForCompletion(quote.bestRoute.id)
      }
    } catch (error) {
      console.error('Bridge execution failed:', error)
    }
  }

  const pollForCompletion = async (routeId: string) => {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    const checkStatus = async () => {
      try {
        const status = await checkBridgeStatus(routeId)

        if (status.status === 'completed' || status.status === 'failed') {
          return // Polling complete
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000) // Check again in 5 seconds
        }
      } catch (error) {
        console.error('Status check failed:', error)
      }
    }

    setTimeout(checkStatus, 5000) // Start checking after 5 seconds
  }

  const handleBridgeTokensDirectly = async () => {
    try {
      const result = await bridgeTokens(
        {
          fromChain: 1,
          toChain: 42161,
          fromToken: '0xA0b86a33E6441036C094eAC4e89BC2Db32B09c1b',
          toToken: 'USDC',
          fromAmount: '1000000',
          fromAddress: userAddress,
          toAddress: '0x0cf76957AF81329917E7c29f8cbf9b8FAd7842ce',
        },
        userAddress,
      )
      console.log('Bridge completed:', result)
    } catch (error) {
      console.error('Bridge failed:', error)
    }
  }

  return (
    <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Bridge Example</h2>

      {/* Current State Display */}
      <div className="p-3 mb-4 rounded bg-gray-50">
        <h3 className="mb-2 font-medium">Current State:</h3>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Bridge In Progress: {bridgeInProgress ? 'Yes' : 'No'}</p>
        <p>Status: {executionStatus}</p>
        {error && <p className="text-red-600">Error: {error}</p>}
        {currentTxHash && (
          <p className="text-blue-600">
            TX Hash: {currentTxHash.slice(0, 10)}...
          </p>
        )}
        {bridgeComplete && (
          <p className="text-green-600">✅ Bridge Complete!</p>
        )}
      </div>

      {/* Routes Display */}
      {quote && (
        <div className="p-3 mb-4 rounded bg-blue-50">
          <h3 className="mb-2 font-medium">Available Routes:</h3>
          <p>Best Route: {quote.bestRoute.id}</p>
          <p>From Amount: {quote.bestRoute.fromAmount}</p>
          <p>To Amount: {quote.bestRoute.toAmount}</p>
          <p>Estimated Time: {quote.estimatedTime}s</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button onClick={handleGetRoutes} disabled={loading} className="w-full">
          {loading ? 'Getting Routes...' : 'Get Routes'}
        </Button>

        <Button
          onClick={handleExecuteBridge}
          disabled={!quote?.bestRoute || bridgeInProgress}
          className="w-full"
          variant="secondary"
        >
          {bridgeInProgress ? 'Executing...' : 'Execute Bridge'}
        </Button>

        <Button
          onClick={handleBridgeTokensDirectly}
          disabled={bridgeInProgress}
          className="w-full"
          variant="outline"
        >
          Bridge Tokens (One Click)
        </Button>

        <Button onClick={resetState} className="w-full" variant="destructive">
          Reset State
        </Button>
      </div>

      {/* Redux State Debug (Optional) */}
      <details className="mt-4">
        <summary className="font-medium cursor-pointer">
          Debug: Redux State
        </summary>
        <pre className="p-2 mt-2 overflow-auto text-xs bg-gray-100 rounded">
          {JSON.stringify(bridgeState, null, 2)}
        </pre>
      </details>
    </div>
  )
}
