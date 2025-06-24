import React, { useState } from 'react'
import { connect, getAccountInfo } from './spotwareClient'

export default function App() {
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState('Disconnected')

  const pushLog = (msg) => {
    setLogs(prev => [msg, ...prev])
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Spotware SDK Demo</h2>
      <p>Status: <b>{status}</b></p>

      <div style={{ marginBottom: 10 }}>
        <button onClick={() => connect(setStatus, pushLog)}>🔌 Connect</button>
        <button onClick={() => getAccountInfo(pushLog)} disabled={status !== 'Connected'}>
          📘 Get Account Info
        </button>
      </div>

      <div style={{
        background: '#111', color: '#0f0',
        padding: 10, minHeight: 200, maxHeight: 300,
        overflowY: 'auto', whiteSpace: 'pre-wrap'
      }}>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}
