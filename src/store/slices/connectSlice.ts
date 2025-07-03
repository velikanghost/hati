import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { JsonRpcSigner } from 'ethers'
import { Chain as ChainType } from '@/lib/types/chain'
import { Token } from '@/lib/types'
import { UsdPrice } from '@/lib/types/all'

// CardTier type definition for backward compatibility
export interface CardTier {
  hasCard: boolean
  tier: 'basic' | 'premium' | 'elite'
  benefits: string[]
  delegationAmount?: string
}

export const fetchTokenPrice = createAsyncThunk(
  'connect/fetchTokenPrice',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`,
      )
      const data = await response.json()
      return data[token]?.usd || 0
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

// Types
type Account = {
  address: string
  provider: any
}

interface ConnectState {
  userEvmAccount: Account
  userEvmAddress: string
  solanaProvider: any
  userSolanaAddress: string
  userSolanaWallet: any
  // MetaMask Card verification (now handled by useMetaMask hook)
  cardTier: CardTier | null
  isVerifyingCard: boolean
  // UI state for payment flow
  selectedToken: Token
  selectedChain: ChainType
  merchantAmount: number
  merchantAddress: string
  transferAmount: string
  availableSourceTokens: Token[]
  userTokensInWallet: Token[]
  tokensInWallet: any[]
  // Token price data
  usdPrice: UsdPrice
  ethPrice: number
  defaultPrice: number
  defaultMerchantToken: string
  defaultMerchantPrice: string
}

const initialState: ConnectState = {
  userEvmAccount: {
    address: '',
    provider: undefined,
  },
  userEvmAddress: '',
  solanaProvider: '',
  userSolanaAddress: '',
  userSolanaWallet: '',
  // MetaMask Card verification
  cardTier: null,
  isVerifyingCard: false,
  // UI state for payment flow
  selectedToken: {
    symbol: '',
    name: '',
    address: '',
  },
  selectedChain: {
    title: '',
    explorer: '',
    icon: '',
  },
  merchantAmount: 5,
  merchantAddress: '0x0cf76957AF81329917E7c29f8cbf9b8FAd7842ce',
  transferAmount: '',
  availableSourceTokens: [],
  userTokensInWallet: [],
  tokensInWallet: [],
  // Token price data
  usdPrice: {
    usd: 0,
  },
  ethPrice: 0,
  defaultPrice: 0,
  defaultMerchantToken: '',
  defaultMerchantPrice: '',
}

const connectSlice = createSlice({
  name: 'connect',
  initialState,
  reducers: {
    setUserEvmAccount: (state, action: PayloadAction<JsonRpcSigner>) => {
      state.userEvmAccount.provider = action.payload
    },
    setUserEvmAddress: (state, action: PayloadAction<string>) => {
      state.userEvmAddress = action.payload
      state.userEvmAccount.address = action.payload
    },
    setCardTier: (state, action: PayloadAction<CardTier>) => {
      state.cardTier = action.payload
    },
    setIsVerifyingCard: (state, action: PayloadAction<boolean>) => {
      state.isVerifyingCard = action.payload
    },
    setAvailableSourceTokens: (state, action: PayloadAction<Token[]>) => {
      state.availableSourceTokens = action.payload
    },
    setUserTokensInWallet: (state, action: PayloadAction<Token[]>) => {
      state.userTokensInWallet = action.payload
    },
    setTransferAmount: (state, action: PayloadAction<string>) => {
      state.transferAmount = action.payload
    },
    // Bridge-related reducers have been moved to bridgeSlice
    setSelectedToken: (state, action: PayloadAction<Token>) => {
      state.selectedToken = action.payload
    },
    setSelectedChain: (state, action: PayloadAction<ChainType>) => {
      state.selectedChain = action.payload
    },
    setMerchantAmount: (state, action: PayloadAction<number>) => {
      state.merchantAmount = action.payload
    },
    setMerchantAddress: (state, action: PayloadAction<string>) => {
      state.merchantAddress = action.payload
    },
    setEthPrice: (state, action: PayloadAction<number>) => {
      state.ethPrice = action.payload
    },
    setDefaultMerchantToken: (state, action: PayloadAction<string>) => {
      state.defaultMerchantToken = action.payload
    },
    setDefaultMerchantPrice: (state, action: PayloadAction<string>) => {
      state.defaultMerchantPrice = action.payload
    },
    // Reset functions
    disconnectWallet: (state) => {
      state.userEvmAccount = { address: '', provider: undefined }
      state.userEvmAddress = ''
      state.cardTier = null
      state.isVerifyingCard = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Token price fetching
      .addCase(fetchTokenPrice.fulfilled, (state, action) => {
        state.ethPrice = action.payload
      })
  },
})

export const {
  setUserEvmAccount,
  setUserEvmAddress,
  setCardTier,
  setIsVerifyingCard,
  setAvailableSourceTokens,
  setUserTokensInWallet,
  setTransferAmount,
  setSelectedToken,
  setSelectedChain,
  setMerchantAmount,
  setMerchantAddress,
  setEthPrice,
  setDefaultMerchantToken,
  setDefaultMerchantPrice,
  disconnectWallet,
} = connectSlice.actions

export default connectSlice.reducer
