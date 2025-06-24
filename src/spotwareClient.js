import { useEffect, useRef, useState, useCallback } from "react";
import { createClientAdapter } from "@spotware-web-team/sdk-external-api";
import { handleConfirmEvent, registerEvent, getAccountInformation } from "@spotware-web-team/sdk";
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
          pushLog(`❌ Connection failed: ${err.message || String(err)}`);
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  const getAccountInfo = useCallback(() => {
    if (!adapter.current) {
      setLogs((prev) => [...prev, "⚠️ Not connected"]);
      return;
    }

    setLogs((prev) => [...prev, "📡 Fetching account info..."]);

    getAccountInformation(adapter.current, {})
      .pipe(
        take(1),
        tap((result) => {
          const type = typeof result;
          const raw = String(result);

          setLogs((prevLogs) => [
            ...prevLogs,
            `📘 typeof result: ${type}`,
            `📘 raw result: ${raw}`,
            `📘 result dump: ${JSON.stringify(result, null, 2)}`
          ]);
        }),
        catchError((err) => {
          setLogs((prev) => [
            ...prev,
            `❌ Account fetch failed.`,
            `🔍 typeof err: ${typeof err}`,
            `🔍 err (stringified): ${JSON.stringify(err)}`,
            `🔍 err as string: ${String(err)}`,
            `🔍 err.message: ${err?.message}`
          ]);
          return [];
        })
      )
      .subscribe();
  }, []);

  return { connected, logs, getAccountInfo };
};
