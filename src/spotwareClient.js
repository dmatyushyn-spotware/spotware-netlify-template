import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import { registerEvent, handleConfirmEvent } from '@spotware-web-team/sdk'
import { take, tap, catchError } from 'rxjs'
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

    // Подписка на события без take(1), чтобы не пропустить быстрое соединение
    registerEvent(client)
      .pipe(
        tap(() => {
          handleConfirmEvent(client, {}).subscribe()
          console.log('Connected')
          setStatus('Connected')
        }),
        catchError((error) => {
          console.error('Connection failed:', error)
          setStatus('Connection failed')
          return []
        })
      )
      .subscribe()
  } catch (err) {
    console.error('Connection error:', err)
    setStatus('Connection error')
  }
}
