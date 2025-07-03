import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const chain = searchParams.get('chain') || 'eth'

  if (!address) {
    return NextResponse.json(
      { success: false, error: 'Missing wallet address in query params' },
      { status: 400 },
    )
  }

  const MORALIS_API_KEY = process.env.MORALIS_API_KEY
  if (!MORALIS_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: 'Server mis-configuration: MORALIS_API_KEY missing',
      },
      { status: 500 },
    )
  }

  try {
    const moralisRes = await fetch(
      `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=${chain}`,
      {
        headers: {
          accept: 'application/json',
          'X-API-Key': MORALIS_API_KEY,
        },
        // Disable Next.js caching; always fetch latest balances
        cache: 'no-store',
      },
    )

    if (!moralisRes.ok) {
      const errText = await moralisRes.text()
      return NextResponse.json(
        { success: false, error: `Moralis error: ${errText}` },
        { status: moralisRes.status },
      )
    }

    const data = await moralisRes.json()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Moralis fetch failed:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
