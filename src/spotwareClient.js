import { createClientAdapter, IExternalTransportAdapter } from '@spotware-web-team/external-api'
import { registerEvent, handleConfirmEvent } from '@spotware-web-team/sdk'
import { take, tap, catchError } from 'rxjs'

let client = null

export const connect = async (setStatus = () => {}) => {
  const logger = createLogger(true)
  client = createClientAdapter({ logger })

  try {
    handleConfirmEvent(client, {})
      .pipe(take(1))
      .subscribe()

    registerEvent(client)
      .pipe(
        take(1),
        tap(() => {
          handleConfirmEvent(client, {}).pipe(take(1)).subscribe()
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
