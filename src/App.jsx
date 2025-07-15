import React, { useState } from "react";
import { useSpotwareClient } from "./spotwareClient";

export default function App() {
  const { connected, logs, createMarketOrder } = useSpotwareClient();
  const [newOrderSymbolId, setNewOrderSymbolId] = useState(1); // По умолчанию символ 1
  const [newOrderVolume, setNewOrderVolume] = useState(100000); // По умолчанию объем 100000
  const [newOrderTradeSide, setNewOrderTradeSide] = useState("BUY"); // По умолчанию покупка

  // Обработчик создания нового маркетного ордера
  const handleCreateNewOrder = () => {
    createMarketOrder(newOrderSymbolId, newOrderVolume, newOrderTradeSide);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Spotware Status: {connected ? "✅ Connected" : "❌ Not Connected"}</h2>

      <button onClick={handleCreateNewOrder} disabled={!connected} style={{ marginTop: 10 }}>
        Создать маркетный ордер
      </button>

      <div style={{ marginTop: 20 }}>
        <div>
          <label>
            symbolId:
            <input
              type="number"
              value={newOrderSymbolId}
              onChange={e => setNewOrderSymbolId(Number(e.target.value))}
            />
          </label>
        </div>

        <div>
          <label>
            volume:
            <input
              type="number"
              value={newOrderVolume}
              onChange={e => setNewOrderVolume(Number(e.target.value))}
            />
          </label>
        </div>

        <div>
          <label>
            Trade Side:
            <select
              value={newOrderTradeSide}
              onChange={e => setNewOrderTradeSide(e.target.value)}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
        </div>
      </div>

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
