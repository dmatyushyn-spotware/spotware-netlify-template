import { useEffect, useRef, useState, useCallback } from "react";
import { createClientAdapter } from "@spotware-web-team/sdk-external-api";
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation
} from "@spotware-web-team/sdk";
import { createLogger } from "@veksa/logger";
import { take, tap } from "rxjs";

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

    getAccountInformation(adapter.current, {}) // <- точно как у программиста
      .pipe(
        take(1),
        tap((result) => {
          // Прямой вывод как у программиста
          setLogs((prevLogs) => [...prevLogs, JSON.stringify(result, null, 2)]);
        })
      )
      .subscribe();
  }, []);

  return { connected, logs, getAccountInfo };
};
