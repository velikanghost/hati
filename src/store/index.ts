import { configureStore } from '@reduxjs/toolkit'
import connectReducer from './slices/connectSlice'
import merchantReducer from './slices/merchantSlice'
import walletReducer from './slices/walletSlice'
import bridgeReducer from './slices/bridgeSlice'
import { bridgeApi } from './api/bridgeApi'

export const store = configureStore({
  reducer: {
    connect: connectReducer,
    merchant: merchantReducer,
    wallet: walletReducer,
    bridge: bridgeReducer,
    [bridgeApi.reducerPath]: bridgeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'connect/setUserEvmAccount',
          'merchant/setMerchantEvmAccount',
          'wallet/connectMetaMask/fulfilled',
          'wallet/processPayment/fulfilled',
          'bridge/setBridgeInProgress',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.provider', 'payload.signer'],
        // Ignore these paths in the state
        ignoredPaths: [
          'connect.userEvmAccount.provider',
          'merchant.merchantEvmAccount.provider',
          'wallet.metaMaskProvider',
          'wallet.lastPaymentResult',
        ],
      },
    }).concat(bridgeApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
