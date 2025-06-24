import { useEffect, useRef, useState, useCallback } from "react";
import { createClientAdapter } from "@spotware-web-team/sdk-external-api";
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation,
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

          // 🧪 Подписка на ВСЕ входящие сообщения (отладка)
          adapter.current.incoming$.subscribe((rawMessage) => {
            pushLog(`📥 RAW INCOMING:\n${JSON.stringify(rawMessage, null, 2)}`);
          });
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

    pushLog("📡 Fetching account info...");

    getAccountInformation(adapter.current, {})
      .pipe(
        take(1),
        tap((result) => {
          pushLog(`📘 Account Info:\n${JSON.stringify(result, null, 2)}`);
        }),
        catchError((err) => {
          pushLog("❌ Account fetch failed.");
          pushLog(`🔍 typeof err: ${typeof err}`);
          pushLog(`🔍 err (stringified): ${JSON.stringify(err)}`);
          pushLog(`🔍 err as string: ${String(err)}`);
          pushLog(`🔍 err.message: ${err?.message}`);
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  return { connected, logs, getAccountInfo };
};
