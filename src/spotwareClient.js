import { useEffect, useRef, useState, useCallback } from "react";
import { createClientAdapter } from "@spotware-web-team/sdk-external-api";
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation,
  getSymbol
} from "@spotware-web-team/sdk";
import { createLogger } from "@veksa/logger";
import { take, tap, catchError } from "rxjs";

export const useSpotwareClient = () => {
  const adapter = useRef(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);

  const pushLog = useCallback((msg, obj = null) => {
    if (typeof msg === "object") {
      setLogs((prev) => [...prev, JSON.stringify(msg, null, 2)]);
    } else {
      setLogs((prev) => [...prev, String(msg)]);
    }

    if (obj) {
      setLogs((prev) => [...prev, JSON.stringify(obj, null, 2)]);
    }
  }, []);

  useEffect(() => {
    const logger = createLogger(true);
    adapter.current = createClientAdapter({ logger });

    pushLog("🔌 Connecting to Spotware...");

    handleConfirmEvent(adapter.current, {}).pipe(take(1)).subscribe();

    registerEvent(adapter.current)
      .pipe(
        take(1),
        tap(() => {
          handleConfirmEvent(adapter.current, {}).pipe(take(1)).subscribe();

          setConnected(true);
          pushLog("✅ Connected to Spotware");
        }),
        catchError((err) => {
          pushLog("❌ Connection failed:");
          pushLog(err?.message || String(err));
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  const getAccountInfo = useCallback(() => {
    if (!adapter.current) {
      pushLog("⚠️ Not connected");
      return;
    }

    pushLog("📰 Fetching account info...");

    try {
      getAccountInformation(adapter.current, {})
        .pipe(
          take(1),
          tap((result) => {
            pushLog("✅ Result received:");
            pushLog(result);
          })
        )
        .subscribe();
    } catch (err) {
      pushLog("❌ Error fetching account info:");
      pushLog(err?.message || String(err));
    }
  }, [pushLog]);

  const getSymbolInfo = useCallback(() => {
    if (!adapter.current) {
      pushLog("⚠️ Not connected");
      return;
    }

    pushLog("📈 Fetching symbol info...");

    try {
      getSymbol(adapter.current, { symbolId: [1] }) // Можно заменить на нужный ID
        .pipe(
          take(1),
          tap((result) => {
            pushLog("✅ Symbol result:");
            pushLog(result);
          })
        )
        .subscribe();
    } catch (err) {
      pushLog("❌ Error fetching symbol info:");
      pushLog(err?.message || String(err));
    }
  }, [pushLog]);

  return {
    connected,
    logs,
    getAccountInfo,
    getSymbolInfo,
  };
};
