// src/App.jsx
import React, { useState } from "react"
import { initClient, fetchAccountInfo } from "./spotwareClient"

export default function App() {
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState("Disconnected")

  const pushLog = (message) => {
    setLogs(prevLogs => [message, ...prevLogs])
  }

  const handleConnect = () => {
    initClient(pushLog, setStatus)
  }

  const handleFetchAccount = () => {
    fetchAccountInfo(pushLog)
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Spotware SDK Demo</h2>
      <p>Status: <strong>{status}</strong></p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={handleConnect}>🔌 Connect</button>
        <button onClick={handleFetchAccount} disabled={status !== "Connected"}>
          📘 Get Account Info
        </button>
      </div>

      <div style={{
        background: "#111",
        color: "#0f0",
        padding: "10px",
        height: "300px",
        overflowY: "auto",
        border: "1px solid #444"
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: "8px", whiteSpace: "pre-wrap" }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
