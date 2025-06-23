import { SpotwareClient } from '@spotware-web-team/sdk'

const client = new SpotwareClient()

const connect = async () => {
  try {
    await client.connect()
    console.log('Connected')
  } catch (err) {
    console.error('Connection failed:', err)
  }
}
