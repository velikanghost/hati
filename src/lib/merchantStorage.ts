// Types
type CardTier = 'Basic' | 'Premium' | 'Elite'

interface MerchantData {
  walletAddress: string
  hatiWalletAddress?: string
  hatiWalletId?: string
  cardTier: CardTier
  isNewUser: boolean
  lastUpdated: number // timestamp for cache invalidation
}

const STORAGE_KEY = 'hati_merchant_profile'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export const merchantStorage = {
  // Save merchant profile to localStorage
  save: (merchantData: Omit<MerchantData, 'lastUpdated'>): void => {
    try {
      const dataWithTimestamp: MerchantData = {
        ...merchantData,
        lastUpdated: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp))
    } catch (error) {
      console.error('Failed to save merchant data to localStorage:', error)
    }
  },

  // Load merchant profile from localStorage
  load: (): MerchantData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const data: MerchantData = JSON.parse(stored)

      // Check if cache is expired
      if (Date.now() - data.lastUpdated > CACHE_DURATION) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to load merchant data from localStorage:', error)
      localStorage.removeItem(STORAGE_KEY) // Clear corrupted data
      return null
    }
  },

  // Clear merchant profile from localStorage
  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear merchant data from localStorage:', error)
    }
  },

  // Update specific fields in stored merchant data
  update: (updates: Partial<Omit<MerchantData, 'lastUpdated'>>): void => {
    try {
      const existing = merchantStorage.load()
      if (existing) {
        const updated = {
          ...existing,
          ...updates,
          lastUpdated: Date.now(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      }
    } catch (error) {
      console.error('Failed to update merchant data in localStorage:', error)
    }
  },

  // Check if merchant data exists and is valid
  isValid: (): boolean => {
    const data = merchantStorage.load()
    return data !== null && !!data.walletAddress
  },
}
