import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation,
  ProtoOAClientSessionEvent
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

  handleConfirmEvent(client, {}).pipe(take(1)).subscribe()

  registerEvent(client)
    .pipe(
      tap((event) => {
        log("📥 Incoming event: " + JSON.stringify(event, null, 2))

        // Подтверждение успешной сессии — только при ProtoOAClientSessionEvent (2043)
        if (event.payloadType === ProtoOAClientSessionEvent) {
          log("✅ Session established (2043)")
          isConnected = true
          onConnected()
        }
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
