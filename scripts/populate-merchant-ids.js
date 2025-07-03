#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('➡️  Populating merchantId for existing merchants...')
  const profiles = await prisma.merchantProfile.findMany({
    where: {
      OR: [{ merchantId: null }, { merchantId: '' }],
    },
    select: { id: true },
  })

  for (const { id } of profiles) {
    let attempts = 0
    while (attempts < 5) {
      const random = Math.floor(Math.random() * 1000)
      const newId = `HT-${random.toString().padStart(3, '0')}`
      try {
        await prisma.merchantProfile.update({
          where: { id },
          data: { merchantId: newId },
        })
        console.log(`✔️  ${newId} assigned to profile ${id}`)
        break
      } catch (err) {
        if (err.code === 'P2002') {
          attempts += 1 // duplicate id, generate new
          continue
        }
        throw err
      }
    }
  }
  console.log('✅ Merchant IDs populated')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
