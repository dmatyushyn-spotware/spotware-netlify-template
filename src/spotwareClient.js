export const connect = async (setStatus = () => {}) => {
  const logger = createLogger(true)
  client = createClientAdapter({ logger })

  try {
    handleConfirmEvent(client, {})
      .pipe(take(1))
      .subscribe()

    registerEvent(client)
      .pipe(
        tap((evt) => {
          console.log("🔔 Incoming Event:", evt)

          if (evt?.payloadType === 2001) {
            setStatus("Connected")
            console.log("✅ Status set to Connected")
          }
        }),
        catchError((error) => {
          console.error("Connection failed:", error)
          setStatus("Connection failed")
          return []
        })
      )
      .subscribe()
  } catch (err) {
    console.error("Connection error:", err)
    setStatus("Connection error")
  }
}
