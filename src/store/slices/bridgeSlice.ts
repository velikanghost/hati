import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BridgeRoute, BridgeQuote } from '../api/bridgeApi'

export interface BridgeState {
  // Route and quote state
  currentQuote: BridgeQuote | null
  selectedRoute: BridgeRoute | null
  isLoadingRoutes: boolean
  routeError: string | null

  // Execution state
  isBridgeInProgress: boolean
  bridgeError: string | null
  currentTxHash: string | null
  bridgeComplete: boolean

  // Status tracking
  routeId: string | null
  executionStatus: 'idle' | 'pending' | 'completed' | 'failed'
  estimatedCompletionTime: number | null

  // Configuration
  slippage: number
  preferCCTP: boolean
}

const initialState: BridgeState = {
  // Route and quote state
  currentQuote: null,
  selectedRoute: null,
  isLoadingRoutes: false,
  routeError: null,

  // Execution state
  isBridgeInProgress: false,
  bridgeError: null,
  currentTxHash: null,
  bridgeComplete: false,

  // Status tracking
  routeId: null,
  executionStatus: 'idle',
  estimatedCompletionTime: null,

  // Configuration
  slippage: 0.5, // 0.5%
  preferCCTP: true,
}

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState,
  reducers: {
    // Route management
    setCurrentQuote: (state, action: PayloadAction<BridgeQuote | null>) => {
      state.currentQuote = action.payload
      if (action.payload?.bestRoute) {
        state.selectedRoute = action.payload.bestRoute
      }
    },

    setSelectedRoute: (state, action: PayloadAction<BridgeRoute | null>) => {
      state.selectedRoute = action.payload
    },

    setIsLoadingRoutes: (state, action: PayloadAction<boolean>) => {
      state.isLoadingRoutes = action.payload
      if (action.payload) {
        state.routeError = null
      }
    },

    setRouteError: (state, action: PayloadAction<string | null>) => {
      state.routeError = action.payload
      state.isLoadingRoutes = false
    },

    // Execution management
    setBridgeInProgress: (state, action: PayloadAction<boolean>) => {
      state.isBridgeInProgress = action.payload
      if (action.payload) {
        state.bridgeError = null
        state.executionStatus = 'pending'
      }
    },

    setBridgeError: (state, action: PayloadAction<string | null>) => {
      state.bridgeError = action.payload
      state.isBridgeInProgress = false
      if (action.payload) {
        state.executionStatus = 'failed'
      }
    },

    setCurrentTxHash: (state, action: PayloadAction<string | null>) => {
      state.currentTxHash = action.payload
    },

    setBridgeComplete: (state, action: PayloadAction<boolean>) => {
      state.bridgeComplete = action.payload
      if (action.payload) {
        state.isBridgeInProgress = false
        state.executionStatus = 'completed'
      }
    },

    // Status tracking
    setRouteId: (state, action: PayloadAction<string | null>) => {
      state.routeId = action.payload
    },

    setExecutionStatus: (
      state,
      action: PayloadAction<BridgeState['executionStatus']>,
    ) => {
      state.executionStatus = action.payload
    },

    setEstimatedCompletionTime: (
      state,
      action: PayloadAction<number | null>,
    ) => {
      state.estimatedCompletionTime = action.payload
    },

    // Configuration
    setSlippage: (state, action: PayloadAction<number>) => {
      state.slippage = action.payload
    },

    setPreferCCTP: (state, action: PayloadAction<boolean>) => {
      state.preferCCTP = action.payload
    },

    // Reset actions
    resetBridgeState: (state) => {
      state.currentQuote = null
      state.selectedRoute = null
      state.routeError = null
      state.bridgeError = null
      state.currentTxHash = null
      state.bridgeComplete = false
      state.routeId = null
      state.executionStatus = 'idle'
      state.estimatedCompletionTime = null
    },

    resetExecutionState: (state) => {
      state.isBridgeInProgress = false
      state.bridgeError = null
      state.currentTxHash = null
      state.bridgeComplete = false
      state.executionStatus = 'idle'
      state.estimatedCompletionTime = null
    },
  },
})

export const {
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
  setSlippage,
  setPreferCCTP,
  resetBridgeState,
  resetExecutionState,
} = bridgeSlice.actions

export default bridgeSlice.reducer
