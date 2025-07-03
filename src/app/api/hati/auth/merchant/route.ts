import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/database'
import { RiskTolerance } from '../../../../../../generated/prisma'

interface AuthRequest {
  action:
    | 'authenticate'
    | 'create-hati-wallet'
    | 'verify-session'
    | 'save-profile'
    | 'get-profile'
    | 'update-profile'
  address?: string
  signature?: string
  message?: string
  sessionToken?: string
  profile?: MerchantProfile
}

interface MerchantProfile {
  merchantId: string
  metamaskAddress: string
  hatiWalletId: string
  hatiWalletAddress: string
  businessName: string
  businessType: string
  website: string
  preferredCurrency: string
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface MerchantSession {
  address: string
  sessionToken: string
  expiresAt: number
  hatiWalletId?: string
  hatiWalletAddress?: string
  profileComplete: boolean
}

class HatiMerchantAuth {
  private jwtSecret: string

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'hati-dev-secret-key'
  }

  // Generate secure session token
  generateSessionToken(address: string): string {
    const timestamp = Date.now().toString()
    const random = randomBytes(16).toString('hex')
    const payload = `${address}:${timestamp}:${random}`

    return createHash('sha256')
      .update(payload + this.jwtSecret)
      .digest('hex')
  }

  // Generate authentication message
  generateAuthMessage(address: string): string {
    const timestamp = Date.now()
    const nonce = randomBytes(16).toString('hex')

    return `Welcome to Hati Payment Gateway!

This request will not trigger a blockchain transaction or cost any gas fees.

Wallet address: ${address}
Timestamp: ${timestamp}
Nonce: ${nonce}

Sign this message to authenticate your merchant account.`
  }

  // Authenticate merchant with signature
  async authenticateMerchant(
    address: string,
    signature: string,
    message: string,
  ) {
    try {
      // Verify the signature
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!isValid) {
        throw new Error('Invalid signature')
      }

      // Generate session token
      const sessionToken = this.generateSessionToken(address)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Find existing session for this address and delete it
      await db.merchantSession.deleteMany({
        where: { address },
      })

      // Create new session in database
      await db.merchantSession.create({
        data: {
          address,
          sessionToken,
          expiresAt,
          profileComplete: false,
        },
      })

      console.log(`✅ Merchant authenticated: ${address}`)

      return {
        sessionToken,
        address,
        expiresAt: expiresAt.getTime(),
        message: 'Authentication successful',
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }

  // Verify session token
  async verifySession(sessionToken: string) {
    try {
      const session = await db.merchantSession.findUnique({
        where: { sessionToken },
      })

      if (!session || session.expiresAt < new Date()) {
        return null
      }

      return {
        address: session.address,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt.getTime(),
        profileComplete: session.profileComplete,
        hatiWalletId: session.hatiWalletId,
        hatiWalletAddress: session.hatiWalletAddress,
      }
    } catch (error) {
      console.error('Session verification failed:', error)
      return null
    }
  }

  // Create Hati wallet for merchant
  async createHatiWallet(sessionToken: string, address: string) {
    try {
      const session = await db.merchantSession.findUnique({
        where: { sessionToken },
      })

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired session')
      }

      // Call Circle API to create wallet
      const walletResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        }/api/circle/wallet`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createWallet',
            userId: address,
            walletType: 'merchant',
            merchantAddress: address,
          }),
        },
      )

      const result = await walletResponse.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      const hatiWallet = result.data

      // Update session with wallet info
      await db.merchantSession.update({
        where: { sessionToken },
        data: {
          hatiWalletId: hatiWallet.id,
          hatiWalletAddress: hatiWallet.address,
        },
      })

      console.log(
        `✅ Hati wallet created for merchant: ${address} -> ${hatiWallet.address}`,
      )

      return {
        hatiWallet,
        sessionToken: this.generateSessionToken(address), // Refresh token
      }
    } catch (error) {
      console.error('Hati wallet creation failed:', error)
      throw error
    }
  }

  // Save merchant profile
  async saveMerchantProfile(
    sessionToken: string,
    profileData: Partial<MerchantProfile>,
  ) {
    try {
      const session = await db.merchantSession.findUnique({
        where: { sessionToken },
      })

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired session')
      }

      if (!session.hatiWalletId || !session.hatiWalletAddress) {
        throw new Error('Hati wallet must be created before saving profile')
      }

      // Convert risk tolerance to enum
      const riskTolerance =
        (profileData.riskTolerance?.toUpperCase() as RiskTolerance) ||
        'MODERATE'

      // Generate unique merchantId (HT-XXX)
      const generateMerchantId = async (): Promise<string> => {
        const maxAttempts = 5
        for (let i = 0; i < maxAttempts; i++) {
          const random = Math.floor(Math.random() * 1000)
          const id = `HT-${random.toString().padStart(3, '0')}`
          const existing = await (db.merchantProfile as any).findUnique({
            where: { merchantId: id },
            select: { merchantId: true },
          })
          if (!existing) return id
        }
        throw new Error('Unable to generate unique merchantId')
      }

      const newMerchantId = await generateMerchantId()

      // Create merchant profile in database
      const profile = await (db.merchantProfile as any).create({
        data: {
          merchantId: newMerchantId,
          metamaskAddress: session.address,
          hatiWalletId: session.hatiWalletId,
          hatiWalletAddress: session.hatiWalletAddress,
          businessName: profileData.businessName!,
          businessType: profileData.businessType || '',
          website: profileData.website || '',
          preferredCurrency: 'USDC',
          riskTolerance,
          isActive: true,
        } as any,
      })

      // Update session to mark profile as complete
      await db.merchantSession.update({
        where: { sessionToken },
        data: { profileComplete: true },
      })

      console.log(
        `✅ Merchant profile saved: ${profile.businessName} (${session.address})`,
      )

      // Convert back to interface format
      const profileResponse: MerchantProfile = {
        // @ts-ignore
        merchantId: (profile as any).merchantId,
        metamaskAddress: profile.metamaskAddress,
        hatiWalletId: profile.hatiWalletId,
        hatiWalletAddress: profile.hatiWalletAddress,
        businessName: profile.businessName,
        businessType: profile.businessType || '',
        website: profile.website || '',
        preferredCurrency: profile.preferredCurrency,
        riskTolerance: profile.riskTolerance.toLowerCase() as
          | 'conservative'
          | 'moderate'
          | 'aggressive',
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        isActive: profile.isActive,
      }

      return {
        profile: profileResponse,
        sessionToken: this.generateSessionToken(session.address), // Refresh token
      }
    } catch (error) {
      console.error('Profile saving failed:', error)
      throw error
    }
  }

  // Get merchant profile
  async getMerchantProfile(sessionToken: string) {
    try {
      const session = await db.merchantSession.findUnique({
        where: { sessionToken },
      })

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired session')
      }

      const profile = await db.merchantProfile.findUnique({
        where: { metamaskAddress: session.address },
      })

      if (!profile) {
        throw new Error('Profile not found')
      }

      // Convert to interface format
      const profileResponse: MerchantProfile = {
        // @ts-ignore
        merchantId: (profile as any).merchantId,
        metamaskAddress: profile.metamaskAddress,
        hatiWalletId: profile.hatiWalletId,
        hatiWalletAddress: profile.hatiWalletAddress,
        businessName: profile.businessName,
        businessType: profile.businessType || '',
        website: profile.website || '',
        preferredCurrency: profile.preferredCurrency,
        riskTolerance: profile.riskTolerance.toLowerCase() as
          | 'conservative'
          | 'moderate'
          | 'aggressive',
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        isActive: profile.isActive,
      }

      return profileResponse
    } catch (error) {
      console.error('Get profile failed:', error)
      throw error
    }
  }

  // Update merchant profile
  async updateMerchantProfile(
    sessionToken: string,
    updates: Partial<MerchantProfile>,
  ) {
    try {
      const session = await db.merchantSession.findUnique({
        where: { sessionToken },
      })

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired session')
      }

      // Convert risk tolerance if provided
      const updateData: any = { ...updates }
      if (updates.riskTolerance) {
        updateData.riskTolerance =
          updates.riskTolerance.toUpperCase() as RiskTolerance
      }

      const updatedProfile = await db.merchantProfile.update({
        where: { metamaskAddress: session.address },
        data: updateData,
      })

      console.log(`✅ Merchant profile updated: ${session.address}`)

      // Convert to interface format
      const profileResponse: MerchantProfile = {
        // @ts-ignore
        merchantId: (updatedProfile as any).merchantId,
        metamaskAddress: updatedProfile.metamaskAddress,
        hatiWalletId: updatedProfile.hatiWalletId,
        hatiWalletAddress: updatedProfile.hatiWalletAddress,
        businessName: updatedProfile.businessName,
        businessType: updatedProfile.businessType || '',
        website: updatedProfile.website || '',
        preferredCurrency: updatedProfile.preferredCurrency,
        riskTolerance: updatedProfile.riskTolerance.toLowerCase() as
          | 'conservative'
          | 'moderate'
          | 'aggressive',
        createdAt: updatedProfile.createdAt.toISOString(),
        updatedAt: updatedProfile.updatedAt.toISOString(),
        isActive: updatedProfile.isActive,
      }

      return profileResponse
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    }
  }

  // Get all merchant profiles (for admin/analytics)
  async getAllMerchantProfiles() {
    try {
      const profiles = await db.merchantProfile.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      })

      return profiles.map((profile) => ({
        // @ts-ignore
        merchantId: (profile as any).merchantId,
        metamaskAddress: profile.metamaskAddress,
        hatiWalletId: profile.hatiWalletId,
        hatiWalletAddress: profile.hatiWalletAddress,
        businessName: profile.businessName,
        businessType: profile.businessType || '',
        website: profile.website || '',
        preferredCurrency: profile.preferredCurrency,
        riskTolerance: profile.riskTolerance.toLowerCase() as
          | 'conservative'
          | 'moderate'
          | 'aggressive',
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        isActive: profile.isActive,
      }))
    } catch (error) {
      console.error('Get all profiles failed:', error)
      throw error
    }
  }
}

// Initialize the auth service
const hatiAuth = new HatiMerchantAuth()

// GET handler for authentication message and merchant profile lookup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter required' },
        { status: 400 },
      )
    }

    // Check if this is a merchant profile lookup
    try {
      const profile = await db.merchantProfile.findUnique({
        where: { metamaskAddress: address },
      })

      if (profile) {
        // Return merchant profile data
        return NextResponse.json({
          walletAddress: profile.metamaskAddress,
          hatiWalletAddress: profile.hatiWalletAddress,
          hatiWalletId: profile.hatiWalletId,
          cardTier:
            profile.riskTolerance === 'CONSERVATIVE'
              ? 'Basic'
              : profile.riskTolerance === 'MODERATE'
              ? 'Premium'
              : 'Elite',
          businessName: profile.businessName,
          businessType: profile.businessType || '',
          isActive: profile.isActive,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        })
      } else {
        // Merchant not found - return 404
        return NextResponse.json(
          { error: 'Merchant not found' },
          { status: 404 },
        )
      }
    } catch (profileError) {
      // If profile lookup fails, assume they want auth message
      const message = hatiAuth.generateAuthMessage(address)
      return NextResponse.json({
        success: true,
        data: { message },
      })
    }
  } catch (error: any) {
    console.error('GET /api/hati/auth/merchant error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

// POST handler for all authentication actions and direct merchant creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a direct merchant creation (no action field)
    if (!body.action && body.walletAddress) {
      // Direct merchant profile creation for onboarding
      const {
        walletAddress,
        hatiWalletAddress,
        hatiWalletId,
        cardTier,
        businessName = 'Default Business',
        businessType = 'e-commerce',
      } = body

      if (!walletAddress || !hatiWalletAddress || !hatiWalletId || !cardTier) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 },
        )
      }

      // Convert card tier to risk tolerance
      const riskTolerance =
        cardTier === 'Basic'
          ? 'CONSERVATIVE'
          : cardTier === 'Premium'
          ? 'MODERATE'
          : 'AGGRESSIVE'

      try {
        const profile = await db.merchantProfile.create({
          data: {
            metamaskAddress: walletAddress,
            hatiWalletId,
            hatiWalletAddress,
            businessName,
            businessType,
            preferredCurrency: 'USDC',
            riskTolerance,
            isActive: true,
          },
        })

        console.log(`✅ Merchant profile created: ${walletAddress}`)

        return NextResponse.json({
          walletAddress: profile.metamaskAddress,
          hatiWalletAddress: profile.hatiWalletAddress,
          hatiWalletId: profile.hatiWalletId,
          cardTier,
          businessName: profile.businessName,
          businessType: profile.businessType,
          isActive: profile.isActive,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        })
      } catch (dbError: any) {
        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { error: 'Merchant profile already exists' },
            { status: 409 },
          )
        }
        throw dbError
      }
    }

    // Existing session-based authentication flow
    const { action, ...params } = body

    switch (action) {
      case 'authenticate':
        const { address, signature, message } = params
        if (!address || !signature || !message) {
          throw new Error('Missing required parameters')
        }

        const authResult = await hatiAuth.authenticateMerchant(
          address,
          signature,
          message,
        )
        return NextResponse.json({ success: true, data: authResult })

      case 'create-hati-wallet':
        const { sessionToken: walletSessionToken, address: walletAddress } =
          params
        if (!walletSessionToken || !walletAddress) {
          throw new Error('Missing required parameters')
        }

        const walletResult = await hatiAuth.createHatiWallet(
          walletSessionToken,
          walletAddress,
        )
        return NextResponse.json({ success: true, data: walletResult })

      case 'save-profile':
        const { sessionToken: profileSessionToken, profile } = params
        if (!profileSessionToken || !profile) {
          throw new Error('Missing required parameters')
        }

        const saveResult = await hatiAuth.saveMerchantProfile(
          profileSessionToken,
          profile,
        )
        return NextResponse.json({ success: true, data: saveResult })

      case 'get-profile':
        const { sessionToken: getSessionToken } = params
        if (!getSessionToken) {
          throw new Error('Session token required')
        }

        const profileResult = await hatiAuth.getMerchantProfile(getSessionToken)
        return NextResponse.json({ success: true, data: profileResult })

      case 'update-profile':
        const { sessionToken: updateSessionToken, profile: updates } = params
        if (!updateSessionToken || !updates) {
          throw new Error('Missing required parameters')
        }

        const updateResult = await hatiAuth.updateMerchantProfile(
          updateSessionToken,
          updates,
        )
        return NextResponse.json({ success: true, data: updateResult })

      case 'verify-session':
        const { sessionToken: verifySessionToken } = params
        if (!verifySessionToken) {
          throw new Error('Session token required')
        }

        const sessionResult = await hatiAuth.verifySession(verifySessionToken)
        if (!sessionResult) {
          throw new Error('Invalid or expired session')
        }

        return NextResponse.json({ success: true, data: sessionResult })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 },
        )
    }
  } catch (error: any) {
    console.error('Merchant auth API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

// PUT handler for updating merchant profiles
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, cardTier, ...updates } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 },
      )
    }

    const updateData: any = { ...updates }

    // Convert card tier to risk tolerance if provided
    if (cardTier) {
      updateData.riskTolerance =
        cardTier === 'Basic'
          ? 'CONSERVATIVE'
          : cardTier === 'Premium'
          ? 'MODERATE'
          : 'AGGRESSIVE'
    }

    try {
      const profile = await db.merchantProfile.update({
        where: { metamaskAddress: walletAddress },
        data: updateData,
      })

      console.log(`✅ Merchant profile updated: ${walletAddress}`)

      return NextResponse.json({
        walletAddress: profile.metamaskAddress,
        hatiWalletAddress: profile.hatiWalletAddress,
        hatiWalletId: profile.hatiWalletId,
        cardTier:
          profile.riskTolerance === 'CONSERVATIVE'
            ? 'Basic'
            : profile.riskTolerance === 'MODERATE'
            ? 'Premium'
            : 'Elite',
        businessName: profile.businessName,
        businessType: profile.businessType || '',
        isActive: profile.isActive,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      })
    } catch (dbError: any) {
      if (dbError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Merchant not found' },
          { status: 404 },
        )
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('PUT /api/hati/auth/merchant error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
