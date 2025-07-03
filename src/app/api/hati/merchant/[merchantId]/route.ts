import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const { merchantId } = params
  if (!merchantId) {
    return NextResponse.json(
      { success: false, error: 'Missing merchantId' },
      { status: 400 },
    )
  }

  try {
    // @ts-ignore – merchantId field exists after schema update
    const profile = await (db.merchantProfile as any).findUnique({
      where: { merchantId },
    })

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (err: any) {
    console.error('Get merchant by ID failed:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error' },
      { status: 500 },
    )
  }
}
