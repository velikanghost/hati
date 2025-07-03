import { NextRequest, NextResponse } from 'next/server'

class RateLimitError extends Error {}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const chainParam = searchParams.get('chain') || ''
  const minUsd = Number(searchParams.get('minUsd') || '0')
  const includeSpam = searchParams.get('includeSpam') === 'true'

  if (!address) {
    return NextResponse.json(
      { success: false, error: 'Missing wallet address' },
      { status: 400 },
    )
  }

  // Map of human-readable names => Moralis chain id
  const CHAIN_MAP: Record<string, string> = {
    'Ethereum Mainnet': 'eth',
    Ethereum: 'eth',
    Optimism: 'optimism',
    Arbitrum: 'arbitrum',
    Base: 'base',
    Linea: 'linea',
    Polygon: 'polygon',
    'Binance Smart Chain': 'bsc',
  }

  const requestedNames = chainParam
    ? chainParam.split(',').map((s) => s.trim())
    : Object.keys(CHAIN_MAP) // default to all supported names

  const chainsToQuery = requestedNames
    .map((name) => ({ name, id: CHAIN_MAP[name] }))
    .filter((c) => Boolean(c.id))

  if (chainsToQuery.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Unsupported chain(s)' },
      { status: 400 },
    )
  }

  // Support multiple Moralis keys rotation – comma-separated in env
  const KEY_POOL = (process.env.MORALIS_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  if (KEY_POOL.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Server mis-configuration: MORALIS_API_KEY missing',
      },
      { status: 500 },
    )
  }
  let keyIndex = 0

  const fetchWithKey = async (url: string): Promise<any> => {
    let attempts = 0
    while (attempts < KEY_POOL.length) {
      const apiKey = KEY_POOL[keyIndex]
      const res = await fetch(url, {
        headers: {
          accept: 'application/json',
          'X-API-Key': apiKey,
        },
        cache: 'no-store',
      })

      if (res.ok) return res.json()

      const text = await res.text()
      // Rate-limit / quota exceeded → rotate key
      if (res.status === 429 || text.toLowerCase().includes('limit')) {
        attempts += 1
        keyIndex = (keyIndex + 1) % KEY_POOL.length
        continue
      }
      // other error
      throw new Error(text || `Moralis error ${res.status}`)
    }
    throw new RateLimitError('All API keys exhausted')
  }

  try {
    const chainResults = await Promise.all(
      chainsToQuery.map(async ({ id, name }) => {
        const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=${id}&include=totalPrice`
        const json = await fetchWithKey(url)
        return { chain: name, tokens: json.result || json }
      }),
    )

    const flattened = chainResults.flatMap(({ chain, tokens }) => {
      return (tokens || []).flatMap((tk: any) => {
        if (!includeSpam && tk.possible_spam) return []
        const usd = tk.usd_value ?? 0
        if (usd < minUsd) return []
        const formatted =
          tk.balance_formatted ||
          (Number(tk.balance) / Math.pow(10, tk.decimals)).toString()
        return {
          chain,
          token_address: tk.token_address,
          symbol: tk.symbol,
          name: tk.name,
          decimals: tk.decimals,
          amount: tk.balance,
          amount_formatted: formatted,
          usd_value: usd,
          thumbnail: tk.thumbnail,
        }
      })
    })

    return NextResponse.json({ success: true, data: flattened })
  } catch (err: any) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, error: 'Rate limit reached on all API keys' },
        { status: 429 },
      )
    }
    console.error('Moralis proxy error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error' },
      { status: 500 },
    )
  }
}
