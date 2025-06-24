import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  registerEvent,
  handleConfirmEvent,
  getAccountInformation
} from '@spotware-web-team/sdk'
import { take, tap, catchError, mergeMap } from 'rxjs'
import { createLogger } from '@veksa/logger'

let client = null

export const connect = async (setStatus = () => {}) => {
  const logger = createLogger(true)
  client = createClientAdapter({ logger })

  try {
    // Подтверждение соединения
    handleConfirmEvent(client, {})
      .pipe(take(1))
      .subscribe()

    // Подписка на все события
    registerEvent(client)
      .pipe(
        tap((evt) => {
          console.log("🔔 Incoming Event:", evt)

          const eventType = evt?.payload?.payload?.payloadType || evt?.payloadType

          // Тут нужно подставить подходящий payloadType для подтверждения авторизации
          if (eventType === 2100) {
            console.log("✅ Trader Authorized")
            setStatus("Connected")
          }
        }),
        catchError((error) => {
          console.error("❌ Connection failed:", error)
          setStatus("Connection failed")
          return []
        })
      )
      .subscribe()
  } catch (err) {
    console.error("❌ Connection error:", err)
    setStatus("Connection error")
  }
}

export const fetchAccountInfo = async (setAccount = () => {}) => {
  if (!client) {
    console.error("❌ Client not initialized")
    return
  }

  getAccountInformation(client)
    .pipe(
      mergeMap((res) => {
        const accounts = res?.payload?.payload?.accounts || []
        console.log("📦 Accounts:", accounts)
        setAccount(accounts)
        return []
      }),
      catchError((error) => {
        console.error("❌ Failed to fetch account info:", error)
        return []
      })
    )
    .subscribe()
}
