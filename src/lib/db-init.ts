import { db, connectDB, checkDatabaseHealth } from './database'

/**
 * Initialize database connection and run health checks
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing Hati database...')

    // Connect to database
    await connectDB()

    // Run health check
    const health = await checkDatabaseHealth()
    if (health.status !== 'healthy') {
      throw new Error(`Database health check failed: ${health.error}`)
    }

    console.log('✅ Database initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

/**
 * Clean up expired sessions (run as a cron job or manually)
 */
export async function cleanupExpiredSessions() {
  try {
    const result = await db.merchantSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    console.log(`🧹 Cleaned up ${result.count} expired sessions`)
    return result.count
  } catch (error) {
    console.error('❌ Session cleanup failed:', error)
    throw error
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const [profileCount, sessionCount, transactionCount] = await Promise.all([
      db.merchantProfile.count({ where: { isActive: true } }),
      db.merchantSession.count(),
      db.merchantTransaction.count(),
    ])

    return {
      activeProfiles: profileCount,
      activeSessions: sessionCount,
      totalTransactions: transactionCount,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('❌ Failed to get database stats:', error)
    throw error
  }
}

/**
 * Reset database (for development only)
 */
export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production')
  }

  try {
    console.log('🔄 Resetting database...')

    // Delete all data in reverse order of dependencies
    await db.merchantTransaction.deleteMany()
    await db.merchantSession.deleteMany()
    await db.merchantProfile.deleteMany()

    console.log('✅ Database reset successfully')
    return true
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    throw error
  }
}
