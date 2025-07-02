#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Setting up Hati database...\n')

const envPath = path.join(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!')
  process.exit(1)
}

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in .env file!')
  process.exit(1)
}

try {
  console.log('1️⃣ Generating Prisma client...')
  execSync('pnpm exec prisma generate', { stdio: 'inherit' })

  console.log('\n2️⃣ Pushing database schema...')
  execSync('pnpm exec prisma db push', { stdio: 'inherit' })

  console.log('\n3️⃣ Database setup complete! ✅')
  console.log('\n🎯 Next steps:')
  console.log('   • Start your development server: pnpm dev')
  console.log(
    '   • Check database health: curl http://localhost:3000/api/health',
  )
  console.log('   • Open Prisma Studio: pnpm exec prisma studio')
  console.log('')
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message)
  console.log('')
  process.exit(1)
}
