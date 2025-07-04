import { useEffect, useState } from 'react'

export interface TokenBalance {
  token_address: string
  symbol: string
  name: string
  decimals: number
  amount: string // raw balance in smallest units
  thumbnail?: string
  chain: string
  usd_value: string
  amount_formatted: string
  usd_price?: number
  native_token?: boolean
}

interface UseTokenBalancesOptions {
  chain?: string // default "eth"
  enabled?: boolean // allow disabling fetch while missing addr
}

// Supported chains for token balances
const SUPPORTED_CHAINS = ['eth', 'arbitrum', 'optimism', 'base', 'linea']

export const useTokenBalances = (
  address?: string,
  { chain = '', enabled = true }: UseTokenBalancesOptions = {},
) => {
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !address) return

    const controller = new AbortController()
    const fetchBalances = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // If specific chain requested, only fetch that one
        const chainsToFetch = chain ? [chain] : SUPPORTED_CHAINS

        // Fetch all chains in parallel
        const responses = await Promise.all(
          chainsToFetch.map(async (chainId) => {
            try {
              const res = await fetch(
                `/api/moralis/tokens?address=${address}&chain=${chainId}`,
                { signal: controller.signal },
              )
              if (!res.ok) {
                console.warn(
                  `Failed to fetch balances for ${chainId}:`,
                  await res.text(),
                )
                return []
              }
              const json = await res.json()
              if (!json.success) {
                console.warn(
                  `Error fetching balances for ${chainId}:`,
                  json.error,
                )
                return []
              }
              return (json.result || []).map((item: any) => ({
                ...item,
                chain: chainId,
              }))
            } catch (err) {
              console.warn(`Failed to fetch ${chainId} balances:`, err)
              return []
            }
          }),
        )

        // Combine all responses and map to TokenBalance format
        const allTokens = responses.flat()

        const mapped: TokenBalance[] = allTokens.map((item: any) => ({
          token_address: item.token_address,
          symbol: item.symbol,
          name: item.name,
          decimals: Number(item.decimals || 18),
          amount: item.balance,
          thumbnail: item.thumbnail,
          chain: item.chain,
          usd_value: item.usd_value?.toString() || '0',
          amount_formatted:
            item.balance_formatted ||
            (
              parseFloat(item.balance) /
              Math.pow(10, Number(item.decimals || 18))
            ).toString(),
          usd_price: item.usd_price,
          native_token: item.native_token,
        }))

        setBalances(mapped)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch balances')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalances()
    return () => controller.abort()
  }, [address, chain, enabled])

  return { balances, isLoading, error }
}
