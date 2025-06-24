import React from "react";
import { useSpotwareClient } from "./spotwareClient";

export default function App() {
  const { connected, logs, getAccountInfo } = useSpotwareClient();

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Spotware Status: {connected ? "✅ Connected" : "❌ Not Connected"}</h2>

      <button onClick={getAccountInfo} disabled={!connected}>
        Get Account Info
      </button>

      <div
        style={{
          marginTop: 20,
          background: "#eee",
          padding: 10,
          borderRadius: 5,
          maxHeight: 400,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {logs.map((log, i) => (
          <pre key={i} style={{ marginBottom: 10 }}>
            {log}
          </pre>
        ))}
      </div>
    </div>
  );
}
