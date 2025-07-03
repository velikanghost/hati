import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/database'
import { getDatabaseStats } from '@/lib/db-init'

export async function GET() {
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth()

    // Get database statistics
    const stats = await getDatabaseStats()

    // Overall system health
    const systemHealth = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    }

    return NextResponse.json({
      success: true,
      data: {
        system: systemHealth,
        database: dbHealth,
        stats,
      },
    })
  } catch (error: any) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        data: {
          system: {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
          },
          database: {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        },
      },
      { status: 500 },
    )
  }
}
