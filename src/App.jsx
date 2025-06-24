import React, { useState } from "react"
import { connect, fetchAccountInfo } from "./spotwareClient"

export default function App() {
  const [status, setStatus] = useState("Not connected")
  const [accounts, setAccounts] = useState([])

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "40px auto" }}>
      <h1>Spotware Client Status</h1>
      <p><strong>Status:</strong> {status}</p>

      <button onClick={() => connect(setStatus)} style={{ marginBottom: 10, padding: "10px 20px" }}>
        Connect to Spotware
      </button>

      {status === "Connected" && (
        <button onClick={() => fetchAccountInfo(setAccounts)} style={{ marginLeft: 10, padding: "10px 20px" }}>
          Get Account Info
        </button>
      )}

      {accounts.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Accounts:</h3>
          <ul>
            {accounts.map((acc, idx) => (
              <li key={idx}>
                ID: {acc.ctidTraderAccountId} — Balance: {acc.balance} — Currency: {acc.currency}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
