import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  registerEvent,
  handleConfirmEvent,
  getAccountInformation,
} from '@spotware-web-team/sdk'
import { take, tap, catchError } from 'rxjs'
import { createLogger } from '@veksa/logger'

let client = null

export const connect = async (setStatus = () => {}, setAccountInfo = () => {}) => {
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

          getAccountInformation(client)
            .pipe(
              take(1),
              tap((accountInfo) => {
                logger.log('Account info:', accountInfo)
                setAccountInfo(accountInfo) // если передали сеттер, сохранить
              }),
              catchError((err) => {
                logger.error('Failed to get account info:', err)
                return []
              })
            )
            .subscribe()

          logger.log('Connected')
          setStatus('Connected')
        }),
        catchError((error) => {
          logger.error('Connection failed:', error)
          setStatus('Connection failed')
          return []
        })
      )
      .subscribe()
  } catch (err) {
    logger.error('Connection error:', err)
    setStatus('Connection error')
  }
}
