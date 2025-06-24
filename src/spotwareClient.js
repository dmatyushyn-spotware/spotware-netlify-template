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

    // Подписка на все события
    registerEvent(client)
      .pipe(
        tap((evt) => {
          console.log("🔔 Incoming Event:", evt)

          if (evt?.payloadType === 2001) {
            console.log("✅ payloadType 2001 detected — setting status to Connected")
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
