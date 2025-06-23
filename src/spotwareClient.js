import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import {
  registerEvent,
  handleConfirmEvent,
  getAccountInformation
} from '@spotware-web-team/sdk'
import { take, tap, catchError } from 'rxjs'
import { createLogger } from '@veksa/logger'

let client = null

export const connect = async (setStatus = () => {}, setAccountInfo = () => {}) => {
  const logger = createLogger(true)
  client = createClientAdapter({ logger })

  try {
    // Подтверждение соединения с хостом
    handleConfirmEvent(client, {})
      .pipe(take(1))
      .subscribe(() => {
        console.log('Confirmed with host')
      })

    // Регистрация клиента
    registerEvent(client)
      .pipe(
        take(1),
        tap(() => {
          console.log('Connected')
          setStatus('Connected')

          // Повторное подтверждение (по примеру из документации)
          handleConfirmEvent(client, {})
            .pipe(take(1))
            .subscribe(() => {
              console.log('Confirmed after registration')

              // Получение информации об аккаунте
              getAccountInformation(client)
                .pipe(
                  take(1),
                  tap((accountInfo) => {
                    console.log('Account Information:', accountInfo)
                    setAccountInfo(accountInfo) // Можно использовать в UI
                  }),
                  catchError((err) => {
                    console.error('Failed to get account info:', err)
                    return []
                  })
                )
                .subscribe()
            })
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
