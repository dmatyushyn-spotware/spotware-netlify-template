import { useEffect, useRef, useState, useCallback } from "react";
import { createClientAdapter } from "@spotware-web-team/sdk-external-api";
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation
} from "@spotware-web-team/sdk";
import { createLogger } from "@veksa/logger";
import { take, tap, catchError } from "rxjs";

export const useSpotwareClient = () => {
  const adapter = useRef(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);

  const pushLog = useCallback((msg) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    const logger = createLogger(true);
    adapter.current = createClientAdapter({ logger });

    pushLog("🔌 Connecting to Spotware...");

    handleConfirmEvent(adapter.current, {})
      .pipe(take(1))
      .subscribe();

    registerEvent(adapter.current)
      .pipe(
        take(1),
        tap(() => {
          handleConfirmEvent(adapter.current, {})
            .pipe(take(1))
            .subscribe();

          setConnected(true);
          pushLog("✅ Connected to Spotware");
        }),
        catchError((err) => {
          pushLog(`❌ Connection failed: ${err.message}`);
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

    pushLog("📡 Fetching account info...");

    getAccountInformation(adapter.current)
      .pipe(
        take(1),
        tap((result) => {
          console.log("💡 Raw result from getAccountInformation:", result);

          if (result) {
            const msg = typeof result === "object"
              ? result?.toString?.() || JSON.stringify(result, null, 2)
              : String(result);
            pushLog(`📘 Account Info:\n${msg}`);
          } else {
            pushLog("⚠️ Account info result is empty or undefined.");
          }
        }),
        catchError((err) => {
          const errText = typeof err === "object"
            ? err?.message || err?.toString?.() || JSON.stringify(err)
            : String(err);
          pushLog(`❌ Account fetch failed: ${errText}`);
          return [];
        })
      )
      .subscribe({
        complete: () => {
          pushLog("✅ Account info request completed.");
        }
      });
  }, [pushLog]);

  return { connected, logs, getAccountInfo };
};
