import React, { useState } from "react";
import { connect, fetchAccountInfo } from "./spotwareClient";

export default function App() {
  const [status, setStatus] = useState("Not connected");
  const [logs, setLogs] = useState([]);

  const pushLog = (msg) => setLogs((prev) => [...prev, msg]);

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 600, margin: "40px auto" }}>
      <h1>Spotware Client Status</h1>
      <p><strong>Status:</strong> {status}</p>

      <div style={{ display: "flex", gap: "10px", marginBottom: 15 }}>
        <button
          onClick={() => connect(setStatus, pushLog)}
          disabled={status === "Connecting..." || status === "Connected"}
        >
          {status === "Not connected" ? "Connect to Spotware" : status === "Connecting..." ? "Connecting..." : "Connected"}
        </button>
        <button
          onClick={() => fetchAccountInfo(pushLog)}
          disabled={status !== "Connected"}
        >
          Get Account Info
        </button>
      </div>

      <div style={{
        background: "#f9f9f9",
        border: "1px solid #ddd",
        padding: 10,
        borderRadius: 4,
        maxHeight: 300,
        overflowY: "auto",
        fontSize: 12
      }}>
        {logs.map((log, i) => <pre key={i}>{log}</pre>)}
      </div>
    </div>
  );
}
