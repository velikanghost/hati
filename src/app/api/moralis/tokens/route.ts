import { NextResponse } from 'next/server'

const MORALIS_API_KEY = process.env.MORALIS_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const chain = searchParams.get('chain')?.toLowerCase() || 'linea'

  if (!address) {
    return NextResponse.json(
      { success: false, error: 'Address is required' },
      { status: 400 },
    )
  }

  if (!MORALIS_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Moralis API key not configured' },
      { status: 500 },
    )
  }

  try {
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=${chain}`,
      {
        headers: {
          Accept: 'application/json',
          'X-API-Key': MORALIS_API_KEY,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.statusText}`)
    }

    const tokens = await response.json()
    return NextResponse.json({ success: true, tokens })
  } catch (error: any) {
    console.error('Failed to fetch token balances:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch token balances',
      },
      { status: 500 },
    )
  }
}
