import { generateEntitySecret } from '@circle-fin/developer-controlled-wallets'

console.log('🔐 Generating Circle Entity Secret...\n')

generateEntitySecret()

console.log('\n✅ Entity Secret generated!')
console.log(' Copy the Entity Secret to your .env file as CIRCLE_ENTITY_SECRET')
console.log(' Keep it secure - you cannot recover this secret!')
