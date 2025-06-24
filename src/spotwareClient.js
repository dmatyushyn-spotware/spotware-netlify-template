// src/spotwareClient.js
import { useEffect, useRef, useState, useCallback } from "react"
import { createClientAdapter } from "@spotware-web-team/sdk-external-api"
import { handleConfirmEvent, registerEvent, getAccountInformation } from "@spotware-web-team/sdk"
import { createLogger } from "@veksa/logger"
import { take, tap, catchError } from "rxjs"

export const useSpotwareClient = () => {
  const adapter = useRef(null)
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const logger = createLogger(true)
    adapter.current = createClientAdapter({ logger })

    setLogs((prev) => [...prev, "🔌 Connecting to Spotware..."])

    // Первый вызов handleConfirmEvent
    handleConfirmEvent(adapter.current, {})
      .pipe(take(1))
      .subscribe()

    // Затем registerEvent
    registerEvent(adapter.current)
      .pipe(
        take(1),
        tap(() => {
          // Второй вызов handleConfirmEvent
          handleConfirmEvent(adapter.current, {})
            .pipe(take(1))
            .subscribe()

          setConnected(true)
          setLogs((prev) => [...prev, "✅ Connected to Spotware"])
        }),
        catchError((err) => {
          setLogs((prev) => [...prev, `❌ Connection failed: ${err?.message || String(err)}`])
          return []
        })
      )
      .subscribe()
  }, [])

  const getAccountInfo = useCallback(() => {
    if (!adapter.current) {
      setLogs((prev) => [...prev, "⚠️ Not connected"])
      return
    }

    setLogs((prev) => [...prev, "📡 Fetching account info..."])

    getAccountInformation(adapter.current, {})
      .pipe(
        take(1),
        tap((result) => {
          setLogs((prevLogs) => [...prevLogs, JSON.stringify(result, null, 2)])
        })
      )
      .subscribe()
  }, [])

  return { connected, logs, getAccountInfo }
}
