import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation
} from '@spotware-web-team/sdk'
import { take, tap, catchError, mergeMap } from 'rxjs'
import { createLogger } from '@veksa/logger'

let client = null
let logCallback = null

export const setLogger = (cb) => {
  logCallback = cb
}

const log = (msg) => {
  console.log(msg)
  if (typeof logCallback === 'function') {
    logCallback(msg)
  }
}

export const connect = async (setStatus = () => {}) => {
  const logger = createLogger(true)
  client = createClientAdapter({ logger })

  log('🛰 Connecting to Spotware...')
  handleConfirmEvent(client, {}).pipe(take(1)).subscribe()

  registerEvent(client)
    .pipe(
      take(1),
      tap(() => {
        handleConfirmEvent(client, {}).pipe(take(1)).subscribe()
        log('✅ Connected to Spotware')
        setStatus('Connected')
      }),
      catchError((error) => {
        log('❌ Connection failed: ' + error.message)
        setStatus('Connection failed')
        return []
      })
    )
    .subscribe()
}

export const getClient = () => client

export const fetchAccountInfo = async (setAccounts = () => {}) => {
  if (!client) {
    log('❌ Client not connected')
    return
  }

  log('📡 Requesting account information...')
  getAccountInformation(client, {})
    .pipe(
      take(1),
      mergeMap((res) => {
        const accounts = res?.payload?.payload?.accounts || []
        log('📦 Account info received')
        setAccounts(accounts)
        return []
      }),
      catchError((err) => {
        log('❌ Failed to get account info: ' + err.message)
        return []
      })
    )
    .subscribe()
}
