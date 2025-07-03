import { registerEntitySecretCiphertext } from '@circle-fin/developer-controlled-wallets'
//import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET
const API_KEY = process.env.CIRCLE_API_KEY

async function registerEntitySecret() {
  try {
    console.log('🔐 Registering Entity Secret with Circle...')

    if (!API_KEY) {
      console.error('❌ Please set CIRCLE_API_KEY env')
      process.exit(1)
    }

    const response = await registerEntitySecretCiphertext({
      apiKey: API_KEY,
      entitySecret: ENTITY_SECRET,
      recoveryFileDownloadPath: 'hati-entity-recovery.dat',
    })

    // if (response.data?.recoveryFile) {
    //   fs.writeFileSync('hati-entity-recovery.dat', response.data.recoveryFile)
    //   console.log('💾 Recovery file saved as: hati-entity-recovery.dat')
    // }

    console.log('✅ Entity Secret registered successfully!')
  } catch (error) {
    console.error('❌ Registration failed:', error.message)
  }
}

registerEntitySecret()
