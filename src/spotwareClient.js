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

    getAccountInformation(adapter.current, {})
      .pipe(
        take(1),
        tap((result) => {
          if (!result) {
            pushLog("⚠️ Warning: Received empty result from getAccountInformation()");
          }

          pushLog("📘 Raw result:");
          pushLog(String(result));

          try {
            const json = JSON.stringify(result, null, 2);
            pushLog(`📘 Account Info (JSON):\n${json}`);
          } catch (err) {
            pushLog("❌ JSON.stringify failed:");
            pushLog(`🔍 typeof result: ${typeof result}`);
            pushLog(`🔍 result (stringified): ${String(result)}`);
            pushLog(`🔍 err.message: ${err?.message || String(err)}`);
          }
        }),
        catchError((err) => {
          pushLog("❌ Account fetch failed.");
          pushLog(`🔍 typeof err: ${typeof err}`);
          pushLog(`🔍 err (stringified): ${JSON.stringify(err)}`);
          pushLog(`🔍 err as string: ${String(err)}`);
          pushLog(`🔍 err.message: ${err?.message || "N/A"}`);
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  return { connected, logs, getAccountInfo };
};
