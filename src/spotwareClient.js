import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation
} from '@spotware-web-team/sdk'
import { take, tap, catchError } from 'rxjs'
import { createLogger } from '@veksa/logger'

let adapter = null

export const connect = (setStatus, pushLog) => {
  const logger = createLogger(true)
  adapter = createClientAdapter({ logger })

  pushLog('🛰️ Connecting...')

  handleConfirmEvent(adapter, {})
    .pipe(take(1))
    .subscribe()

  registerEvent(adapter)
    .pipe(
      take(1),
      tap(() => {
        handleConfirmEvent(adapter, {}).pipe(take(1)).subscribe()
        pushLog('✅ Connected')
        setStatus('Connected')
      }),
      catchError((error) => {
        pushLog(`❌ Connection failed: ${error}`)
        setStatus('Connection failed')
        return []
      })
    )
    .subscribe()
}

export const getAccountInfo = (pushLog) => {
  if (!adapter) {
    pushLog('⚠️ Not connected')
    return
  }

  getAccountInformation(adapter, {})
    .pipe(
      take(1),
      tap(result => {
        pushLog('📘 Account Info:\n' + JSON.stringify(result, null, 2))
      }),
      catchError(error => {
        pushLog(`❌ Account fetch failed: ${error}`)
        return []
      })
    )
    .subscribe()
}
