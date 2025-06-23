import React, { useState } from "react";
import { initClient } from "./spotwareClient";

export default function App() {
  const [status, setStatus] = useState("Not connected");

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "40px auto" }}>
      <h1>Spotware Client Status</h1>
      <p><strong>Status:</strong> {status}</p>
      <button onClick={() => initClient(setStatus)} style={{ padding: "10px 20px", cursor: "pointer" }}>
        Connect to Spotware
      </button>
    </div>
  );
}
