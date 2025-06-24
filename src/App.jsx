import React, { useState, useEffect } from "react"
import {
  initClient,
  fetchAccountInfo
} from "./spotwareClient"

export default function App() {
  const [status, setStatus] = useState("Not connected")
  const [accounts, setAccounts] = useState([])
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // Получаем логи из клиента
    setLogger((msg) => setLogs((prev) => [...prev, msg]))
  }, [])

  const handleConnect = () => {
    setStatus("Connecting...")
    initClient(
      () => setStatus("Connected"),
      () => setStatus("Connection failed")
    )
  }

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 600, margin: "40px auto" }}>
      <h1>Spotware Client Status</h1>
      <p><strong>Status:</strong> {status}</p>

      <div style={{ display: "flex", gap: "10px", marginBottom: 10 }}>
        <button onClick={handleConnect} disabled={status === "Connected" || status === "Connecting..."}>
          Connect to Spotware
        </button>

        <button onClick={() => fetchAccountInfo(setAccounts)} disabled={status !== "Connected"}>
          Get Account Info
        </button>
      </div>

      <div style={{
        background: "#f9f9f9",
        border: "1px solid #ddd",
        padding: 10,
        borderRadius: 4,
        maxHeight: 200,
        overflowY: "auto",
        fontSize: 12,
        marginBottom: 20
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      {accounts.length > 0 && (
        <div>
          <h3>Accounts:</h3>
          <ul>
            {accounts.map((acc, idx) => (
              <li key={idx}>
                ID: {acc.ctidTraderAccountId}, Balance: {acc.balance}, Currency: {acc.currency}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
