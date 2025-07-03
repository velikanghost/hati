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
}

interface UseTokenBalancesOptions {
  chain?: string // default "eth"
  enabled?: boolean // allow disabling fetch while missing addr
}

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
        const res = await fetch(
          `/api/moralis/tokens?address=${address}&chain=${chain}`,
          { signal: controller.signal },
        )
        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText)
        }
        const json = await res.json()
        if (json.success) {
          let rawList: any[] = []

          const dataArray: any[] = Array.isArray(json.data) ? json.data : []

          rawList = dataArray // already flattened

          const mapped: TokenBalance[] = rawList.map((item) => ({
            token_address: item.token_address,
            symbol: item.symbol,
            name: item.name,
            decimals: Number(item.decimals ?? 18),
            amount: item.amount,
            thumbnail: item.thumbnail,
            chain: item.chain,
            usd_value: item.usd_value,
            amount_formatted: item.amount_formatted,
          }))

          setBalances(mapped)
        } else {
          throw new Error(json.error || 'Unknown error')
        }
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
