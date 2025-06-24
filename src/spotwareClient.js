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

    pushLog("\u{1F50C} Connecting to Spotware...");

    const confirm$ = handleConfirmEvent(adapter.current, {});
    if (!confirm$ || typeof confirm$.subscribe !== 'function') {
      pushLog("❌ handleConfirmEvent failed: not a valid observable");
      return;
    }

    confirm$.pipe(take(1)).subscribe();

    const reg$ = registerEvent(adapter.current);
    if (!reg$ || typeof reg$.pipe !== 'function') {
      pushLog("❌ registerEvent failed: not a valid observable");
      return;
    }

    reg$
      .pipe(
        take(1),
        tap(() => {
          const confirmAgain$ = handleConfirmEvent(adapter.current, {});
          if (!confirmAgain$ || typeof confirmAgain$.subscribe !== 'function') {
            pushLog("❌ handleConfirmEvent (2nd) failed: not a valid observable");
            return;
          }

          confirmAgain$.pipe(take(1)).subscribe();
          setConnected(true);
          pushLog("✅ Connected to Spotware");
        }),
        catchError((err) => {
          pushLog(`❌ registerEvent catchError: ${err?.message || String(err)}`);
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

    pushLog("\u{1F4F0} Fetching account info...");

    const account$ = getAccountInformation(adapter.current, {});
    if (!account$ || typeof account$.pipe !== 'function') {
      pushLog("❌ getAccountInformation failed: not a valid observable");
      return;
    }

    account$
      .pipe(
        take(1),
        tap((result) => {
          pushLog(`📘 Raw account result: ${typeof result}`);
          try {
            pushLog(JSON.stringify(result, null, 2));
          } catch (err) {
            pushLog(`❌ JSON stringify error: ${err?.message || String(err)}`);
          }
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
