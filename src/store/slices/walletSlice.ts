import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// CardTier type definition for backward compatibility
export interface CardTier {
  hasCard: boolean
  tier: 'basic' | 'premium' | 'elite'
  benefits: string[]
  delegationAmount?: string
}

export type WalletType = 'metamask' | 'hati' | null

export interface HatiWallet {
  id: string
  address: string
  blockchain: string
  state: 'LIVE' | 'FROZEN'
  walletSetId: string
  createDate: string
  updateDate: string
}

export interface WalletState {
  // General wallet state
  currentWalletType: WalletType
  isConnecting: boolean
  error: string | null

  // MetaMask wallet state (now managed by useMetaMask hook)
  metaMaskConnected: boolean
  metaMaskAddress: string | null
  metaMaskProvider: any
  cardTier: CardTier | null
  isVerifyingCard: boolean

  // Hati wallet state (now managed by useCircleWallet hook)
  hatiWalletConnected: boolean
  hatiWallets: HatiWallet[]
  primaryHatiWallet: HatiWallet | null
  isCreatingHatiWallet: boolean

  // Payment capabilities
  canPayWithMetaMask: boolean
  canPayWithHati: boolean

  // Transaction state
  isInitiatingPayment: boolean
  lastPaymentResult: any
}

const initialState: WalletState = {
  currentWalletType: null,
  isConnecting: false,
  error: null,

  metaMaskConnected: false,
  metaMaskAddress: null,
  metaMaskProvider: null,
  cardTier: null,
  isVerifyingCard: false,

  hatiWalletConnected: false,
  hatiWallets: [],
  primaryHatiWallet: null,
  isCreatingHatiWallet: false,

  canPayWithMetaMask: false,
  canPayWithHati: false,

  isInitiatingPayment: false,
  lastPaymentResult: null,
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // General wallet actions
    setCurrentWalletType: (state, action: PayloadAction<WalletType>) => {
      state.currentWalletType = action.payload
    },
    setIsConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // MetaMask wallet actions
    setMetaMaskConnected: (state, action: PayloadAction<boolean>) => {
      state.metaMaskConnected = action.payload
    },
    setMetaMaskAddress: (state, action: PayloadAction<string | null>) => {
      state.metaMaskAddress = action.payload
    },
    setMetaMaskProvider: (state, action: PayloadAction<any>) => {
      state.metaMaskProvider = action.payload
    },
    setCardTier: (state, action: PayloadAction<CardTier | null>) => {
      state.cardTier = action.payload
    },
    setIsVerifyingCard: (state, action: PayloadAction<boolean>) => {
      state.isVerifyingCard = action.payload
    },

    // Hati wallet actions
    setHatiWalletConnected: (state, action: PayloadAction<boolean>) => {
      state.hatiWalletConnected = action.payload
    },
    setHatiWallets: (state, action: PayloadAction<HatiWallet[]>) => {
      state.hatiWallets = action.payload
    },
    setPrimaryHatiWallet: (state, action: PayloadAction<HatiWallet | null>) => {
      state.primaryHatiWallet = action.payload
    },
    setIsCreatingHatiWallet: (state, action: PayloadAction<boolean>) => {
      state.isCreatingHatiWallet = action.payload
    },

    // Payment capability actions
    setCanPayWithMetaMask: (state, action: PayloadAction<boolean>) => {
      state.canPayWithMetaMask = action.payload
    },
    setCanPayWithHati: (state, action: PayloadAction<boolean>) => {
      state.canPayWithHati = action.payload
    },

    // Transaction actions
    setIsInitiatingPayment: (state, action: PayloadAction<boolean>) => {
      state.isInitiatingPayment = action.payload
    },
    setLastPaymentResult: (state, action: PayloadAction<any>) => {
      state.lastPaymentResult = action.payload
    },

    // Reset actions
    resetWalletState: (state) => {
      return {
        ...initialState,
      }
    },
    disconnectAllWallets: (state) => {
      state.metaMaskConnected = false
      state.metaMaskAddress = null
      state.metaMaskProvider = null
      state.cardTier = null
      state.hatiWalletConnected = false
      state.hatiWallets = []
      state.primaryHatiWallet = null
      state.currentWalletType = null
      state.canPayWithMetaMask = false
      state.canPayWithHati = false
    },
  },
})

export const {
  setCurrentWalletType,
  setIsConnecting,
  setError,
  setMetaMaskConnected,
  setMetaMaskAddress,
  setMetaMaskProvider,
  setCardTier,
  setIsVerifyingCard,
  setHatiWalletConnected,
  setHatiWallets,
  setPrimaryHatiWallet,
  setIsCreatingHatiWallet,
  setCanPayWithMetaMask,
  setCanPayWithHati,
  setIsInitiatingPayment,
  setLastPaymentResult,
  resetWalletState,
  disconnectAllWallets,
} = walletSlice.actions

export default walletSlice.reducer
