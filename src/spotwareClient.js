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
          pushLog(`❌ Connection failed: ${err?.message || String(err)}`);
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

    const observable = getAccountInformation(adapter.current, {});
    pushLog(`📤 Raw observable: ${String(observable)}`);

    try {
      observable
        .pipe(
          take(1),
          tap((result) => {
            pushLog(`✅ Raw result type: ${typeof result}`);
            pushLog(`✅ Raw result stringified:\n${JSON.stringify(result, null, 2)}`);
          }),
          catchError((err) => {
            pushLog("❌ Account fetch failed.");
            pushLog(`🔍 typeof err: ${typeof err}`);
            pushLog(`🔍 err (stringified): ${JSON.stringify(err)}`);
            pushLog(`🔍 err as string: ${String(err)}`);
            pushLog(`🔍 err.message: ${err?.message || "No message"}`);
            return [];
          })
        )
        .subscribe();
    } catch (e) {
      pushLog("💥 Caught sync error:");
      pushLog(String(e));
    }
  }, [pushLog]);

  return { connected, logs, getAccountInfo };
};
