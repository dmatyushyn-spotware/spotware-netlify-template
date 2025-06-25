import React, { useCallback, useEffect, useRef, useState } from "react";
import { createClientAdapter } from "@spotware-web-team/sdk-external-api";
import {
  getAccountInformation,
  getSymbol,
  handleConfirmEvent,
  registerEvent
} from "@spotware-web-team/sdk";
import { take, tap, catchError } from "rxjs";
import { createLogger } from "@veksa/logger";

export const SpotwareClientComponent = () => {
  const adapter = useRef(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);

  const pushLog = useCallback((entry) => {
    if (typeof entry === "object") {
      setLogs(prev => [...prev, JSON.stringify(entry, null, 2)]);
    } else {
      setLogs(prev => [...prev, String(entry)]);
    }
  }, []);

  useEffect(() => {
    const logger = createLogger(true);
    adapter.current = createClientAdapter({ logger });

    handleConfirmEvent(adapter.current, {}).pipe(take(1)).subscribe();

    registerEvent(adapter.current)
      .pipe(
        take(1),
        tap(() => {
          handleConfirmEvent(adapter.current, {}).pipe(take(1)).subscribe();
          setConnected(true);
          pushLog("✅ Connected to Spotware");
        }),
        catchError(err => {
          pushLog("❌ Connection failed");
          pushLog(err?.message || String(err));
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  const handleAccountInfo = useCallback(() => {
    if (!adapter.current) {
      pushLog("⚠️ Adapter not ready");
      return;
    }

    getAccountInformation(adapter.current, {})
      .pipe(
        take(1),
        tap(result => {
          pushLog("📰 Account Info:");
          pushLog(result);
        }),
        catchError(err => {
          pushLog("❌ Account fetch error");
          pushLog(err?.message || String(err));
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  const handleSymbolInfo = useCallback(() => {
    if (!adapter.current) {
      pushLog("⚠️ Adapter not ready");
      return;
    }

    getSymbol(adapter.current, { symbolId: [1] })
      .pipe(
        take(1),
        tap(result => {
          pushLog("📈 Symbol Info:");
          pushLog(result);
        }),
        catchError(err => {
          pushLog("❌ Symbol fetch error");
          pushLog(err?.message || String(err));
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Status: {connected ? "✅ Connected" : "❌ Not Connected"}</h2>

      <div style={{ marginBottom: 10 }}>
        <button disabled={!connected} onClick={handleAccountInfo}>
          Get Account Info
        </button>
        <button disabled={!connected} onClick={handleSymbolInfo} style={{ marginLeft: 10 }}>
          Get Symbol Info
        </button>
      </div>

      <div
        style={{
          background: "#eee",
          padding: 10,
          borderRadius: 5,
          maxHeight: 400,
          overflowY: "auto",
          whiteSpace: "pre-wrap"
        }}
      >
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: 8 }}>{log}</div>
        ))}
      </div>
    </div>
  );
};
