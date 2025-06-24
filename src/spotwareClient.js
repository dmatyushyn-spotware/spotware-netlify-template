import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation
} from '@spotware-web-team/sdk'
import { take, tap, catchError, mergeMap } from 'rxjs'
import { createLogger } from '@veksa/logger'

let client = null

export const connect = async (setStatus = () => {}) => {
  const logger = createLogger(true)
  client = createClientAdapter({ logger })

  // Первый этап: handshake
  handleConfirmEvent(client, {}).pipe(take(1)).subscribe()

  // Подтверждение от сервера
  registerEvent(client)
    .pipe(
      take(1),
      tap(() => {
        handleConfirmEvent(client, {}).pipe(take(1)).subscribe()
        console.log("✅ Connected to Spotware")
        setStatus("Connected")
      }),
      catchError((error) => {
        console.error("❌ Connection failed:", error)
        setStatus("Connection failed")
        return []
      })
    )
    .subscribe()
}

// Универсальный доступ к клиенту
export const getClient = () => client

// Запрос информации об аккаунте
export const fetchAccountInfo = async (setAccounts = () => {}) => {
  if (!client) {
    console.error("❌ Client not connected")
    return
  }

  getAccountInformation(client, {})
    .pipe(
      take(1),
      mergeMap((res) => {
        const accounts = res?.payload?.payload?.accounts || []
        console.log("📦 Accounts:", accounts)
        setAccounts(accounts)
        return []
      }),
      catchError((err) => {
        console.error("❌ Account info error:", err)
        return []
      })
    )
    .subscribe()
}
