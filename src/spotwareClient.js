import { createClientAdapter } from '@spotware-web-team/sdk-external-api'
import { registerEvent, handleConfirmEvent } from '@spotware-web-team/sdk'
import { take, tap, catchError, of } from 'rxjs'

let client = null

export const connect = async (setStatus = () => {}) => {
  client = createClientAdapter({})

  if (!client) {
    console.error("Client initialization failed")
    setStatus('Initialization error')
    return
  }

  const confirm$ = handleConfirmEvent(client, {})
  if (confirm$?.subscribe) {
    confirm$.pipe(take(1)).subscribe()
  } else {
    console.error("handleConfirmEvent returned undefined")
  }

  const event$ = registerEvent(client)
  if (event$?.subscribe) {
    event$
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
          return of()
        })
      )
      .subscribe()
  } else {
    console.error("registerEvent returned undefined")
    setStatus('Registration error')
  }
}
