import { NextRequest, NextResponse } from 'next/server'

interface HatiWalletConfig {
  apiKey: string
  entitySecret: string
}

class CircleWalletAPI {
  private config: HatiWalletConfig
  private baseUrl: string

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_CIRCLE_API_KEY!,
      entitySecret: process.env.NEXT_PUBLIC_CIRCLE_ENTITY_SECRET!,
    }
    this.baseUrl = 'https://api.circle.com/v1/w3s'
  }

  private async generateEntitySecretCiphertext(): Promise<string> {
    try {
      const publicKeyResponse = await fetch(
        `${this.baseUrl}/config/entity/publicKey`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!publicKeyResponse.ok) {
        throw new Error('Failed to fetch public key')
      }

      const { data } = await publicKeyResponse.json()
      const publicKey = data.publicKey

      const pemHeader = '-----BEGIN RSA PUBLIC KEY-----'
      const pemFooter = '-----END RSA PUBLIC KEY-----'
      const pemContents = publicKey
        .replace(pemHeader, '')
        .replace(pemFooter, '')
        .replace(/\s/g, '')

      const entitySecretBytes = new Uint8Array(
        this.config.entitySecret
          .match(/.{1,2}/g)!
          .map((byte) => parseInt(byte, 16)),
      )

      const keyData = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))
      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        keyData,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt'],
      )

      const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        cryptoKey,
        entitySecretBytes,
      )

      return btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    } catch (error) {
      console.error('Error generating entity secret ciphertext:', error)
      throw new Error('Failed to generate entity secret ciphertext')
    }
  }

  async createWallet(
    userId: string,
    blockchain: 'ETH' | 'MATIC' | 'AVAX' = 'ETH',
  ) {
    try {
      const ciphertext = await this.generateEntitySecretCiphertext()

      const response = await fetch(`${this.baseUrl}/developer/wallets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountType: 'SCA',
          blockchains: [blockchain],
          count: 1,
          walletSetId: `hati-${userId}`,
          entitySecretCiphertext: ciphertext,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Circle API Error: ${error.message || 'Unknown error'}`)
      }

      const { data } = await response.json()
      return data.wallets[0]
    } catch (error) {
      console.error('Error creating Hati wallet:', error)
      throw error
    }
  }

  async getWalletBalance(walletId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/developer/wallets/${walletId}/balances`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance')
      }

      const { data } = await response.json()
      return data.tokenBalances
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      throw error
    }
  }
}

const circleAPI = new CircleWalletAPI()

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'createWallet':
        const wallet = await circleAPI.createWallet(
          params.userId,
          params.blockchain,
        )
        return NextResponse.json({ success: true, data: wallet })

      case 'getBalance':
        const balance = await circleAPI.getWalletBalance(params.walletId)
        return NextResponse.json({ success: true, data: balance })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 },
        )
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
