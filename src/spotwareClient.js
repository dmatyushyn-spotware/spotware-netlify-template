import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation
} from '@spotware-web-team/sdk'
import { catchError, take, tap, mergeMap } from 'rxjs'
import { createLogger } from '@veksa/logger'

let client = null
let isConnected = false
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

export const initClient = (onConnected = () => {}, onError = () => {}) => {
  const logger = createLogger(true)
  client = createClientAdapter({ logger })
  log("🛰 Connecting to Spotware...")

  // Первый handshake
  handleConfirmEvent(client, {}).pipe(take(1)).subscribe()

  // Подписка на события Spotware
  registerEvent(client)
    .pipe(
      tap((event) => {
        log("📥 Incoming event: " + JSON.stringify(event, null, 2))
      }),
      take(1),
      tap(() => {
        // Второй handshake
        handleConfirmEvent(client, {}).pipe(take(1)).subscribe()
        isConnected = true
        log("✅ Connected to Spotware")
        onConnected()
      }),
      catchError((error) => {
        log("❌ Connection failed: " + error.message)
        onError(error)
        return []
      })
    )
    .subscribe()
}

export const fetchAccountInfo = async (setAccounts = () => {}) => {
  if (!client || !isConnected) {
    log("❌ Client not connected")
    return
  }

  log("📡 Requesting account information...")
  getAccountInformation(client, {})
    .pipe(
      take(1),
      mergeMap((res) => {
        const accounts = res?.payload?.payload?.accounts || []
        log("📦 Account info received")
        setAccounts(accounts)
        return []
      }),
      catchError((err) => {
        log("❌ Failed to get account info: " + err.message)
        return []
      })
    )
    .subscribe()
}
