import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { JsonRpcSigner } from 'ethers'

// Async thunks
export const connectMerchantWallet = createAsyncThunk(
  'merchant/connectWallet',
  async (_, { rejectWithValue }) => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        return accounts[0]
      } catch (error: any) {
        return rejectWithValue(error.message)
      }
    } else {
      return rejectWithValue('MetaMask is not installed')
    }
  },
)

// Add the merchant-specific redeemAndFinalize async thunk
export const merchantRedeemAndFinalize = createAsyncThunk(
  'merchant/redeemAndFinalize',
  async () => {
    return { finished: true }
  },
)

// Removed fetchAllOperations - now handled by RTK Query merchantApi

// Types
type Account = {
  address: string
  provider: any
}

interface MerchantState {
  merchantEvmAccount: Account
  merchantEvmAddress: string
  isRedeemCompleted: boolean
  loading: boolean
  bridgeComplete: boolean
}

const initialState: MerchantState = {
  merchantEvmAccount: {
    address: '',
    provider: undefined,
  },
  merchantEvmAddress: '',
  isRedeemCompleted: false,
  loading: false,
  bridgeComplete: false,
}

const merchantSlice = createSlice({
  name: 'merchant',
  initialState,
  reducers: {
    setMerchantEvmAccount: (state, action: PayloadAction<JsonRpcSigner>) => {
      state.merchantEvmAccount.provider = action.payload
    },
    setMerchantEvmAddress: (state, action: PayloadAction<string>) => {
      state.merchantEvmAddress = action.payload
      state.merchantEvmAccount.address = action.payload
    },
    setIsRedeemCompleted: (state, action: PayloadAction<boolean>) => {
      state.isRedeemCompleted = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setBridgeComplete: (state, action: PayloadAction<boolean>) => {
      state.bridgeComplete = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectMerchantWallet.pending, (state) => {
        state.loading = true
      })
      .addCase(connectMerchantWallet.fulfilled, (state, action) => {
        state.loading = false
        state.merchantEvmAddress = action.payload
        state.merchantEvmAccount.address = action.payload
      })
      .addCase(connectMerchantWallet.rejected, (state) => {
        state.loading = false
      })
      .addCase(merchantRedeemAndFinalize.pending, (state) => {
        // Loading is handled by the thunk dispatch
      })
      .addCase(merchantRedeemAndFinalize.fulfilled, (state, action) => {
        state.loading = false
        state.isRedeemCompleted = action.payload.finished
      })
      .addCase(merchantRedeemAndFinalize.rejected, (state) => {
        state.loading = false
      })
  },
})

export const {
  setMerchantEvmAccount,
  setMerchantEvmAddress,
  setIsRedeemCompleted,
  setLoading,
  setBridgeComplete,
} = merchantSlice.actions

export default merchantSlice.reducer
