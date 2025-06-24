// src/spotwareClient.js
import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation
} from '@spotware-web-team/sdk'
import { take, tap } from 'rxjs'
import { createLogger } from '@veksa/logger'

let adapter = null

/**
 * Инициализация клиента и подключение к Spotware
 */
export function initClient(pushLog, setStatus) {
  const logger = createLogger(true)

  adapter = createClientAdapter({ logger })
  pushLog('🛰️ Connecting to Spotware...')

  // Подтверждаем соединение
  handleConfirmEvent(adapter, {}).pipe(take(1)).subscribe()

  // Регистрируем событие
  registerEvent(adapter)
    .pipe(
      take(1),
      tap(() => {
        handleConfirmEvent(adapter, {}).pipe(take(1)).subscribe()
        pushLog('✅ Connected to Spotware')
        setStatus('Connected')
      })
    )
    .subscribe()
}

/**
 * Запрашивает информацию по аккаунту
 */
export function fetchAccountInfo(pushLog) {
  if (!adapter) {
    pushLog('⚠️ Not connected. Call initClient() first.')
    return
  }

  getAccountInformation(adapter, {})
    .pipe(
      take(1),
      tap(info => {
        pushLog(`📘 Account Info:\n${JSON.stringify(info, null, 2)}`)
      })
    )
    .subscribe()
}
