import { PrismaClient } from '../../generated/prisma'

declare global {
  // Prevent multiple instances of Prisma Client in development
  var __prisma: PrismaClient | undefined
}

// Database connection with connection pooling optimized for Neon
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['error', 'warn'], // Reduce logging for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Singleton pattern for Prisma Client
export const db = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}

// Database utility functions
export const connectDB = async () => {
  try {
    await db.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export const disconnectDB = async () => {
  try {
    await db.$disconnect()
    console.log('✅ Database disconnected')
  } catch (error) {
    console.error('❌ Database disconnect failed:', error)
  }
}

// Health check function with Neon-optimized retry logic
export const checkDatabaseHealth = async () => {
  try {
    // Add timeout to prevent hanging on Neon auto-pause
    const healthCheck = db.$queryRaw`SELECT 1`
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Database health check timeout')),
        5000,
      ),
    )

    await Promise.race([healthCheck, timeoutPromise])
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Database health check failed:', error)

    // Try to reconnect if connection was closed
    try {
      await db.$disconnect()
      await db.$connect()
      await db.$queryRaw`SELECT 1`
      console.log('✅ Database reconnected successfully')
      return { status: 'healthy', timestamp: new Date().toISOString() }
    } catch (reconnectError) {
      console.error('❌ Database reconnection failed:', reconnectError)
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  }
}

// Transaction helper with retry logic
export const withTransaction = async <T>(
  callback: (
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) => Promise<T>,
  maxRetries = 3,
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(callback, {
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
      })
    } catch (error) {
      lastError = error as Error
      console.warn(`Transaction attempt ${attempt} failed:`, error)

      if (attempt === maxRetries) {
        break
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      )
    }
  }

  throw new Error(
    `Transaction failed after ${maxRetries} attempts: ${lastError!.message}`,
  )
}

// Export Prisma Client type for use in other files
export type { PrismaClient } from '../../generated/prisma'
