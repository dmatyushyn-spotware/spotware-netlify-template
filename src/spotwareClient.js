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

    let observable;

    try {
      observable = getAccountInformation(adapter.current, {});
    } catch (e) {
      pushLog("💥 Exception during getAccountInformation call:");
      pushLog(e.message || String(e));
      return;
    }

    if (!observable || typeof observable.pipe !== "function") {
      pushLog("❌ getAccountInformation returned invalid observable:");
      pushLog(observable);
      return;
    }

    observable
      .pipe(
        take(1),
        tap((result) => {
          pushLog("✅ Result received:");
          pushLog("🔍 typeof result: " + typeof result);
          pushLog("🔍 instanceof Object: " + (result instanceof Object));

          try {
            const resultStr = JSON.stringify(result);
            pushLog("🔍 First 30 chars of JSON: " + resultStr.substring(0, 30));
          } catch (e) {
            pushLog("❌ JSON.stringify failed:");
            pushLog(e.message);
          }

          if (result && typeof result === "object") {
            pushLog("🔍 Top-level keys: " + Object.keys(result).join(", "));

            const trader = result?.payload?.payload?.Trader;
            if (trader) {
              pushLog("👤 Trader Info:");
              pushLog(trader);
            } else {
              pushLog("⚠️ Trader not found, full response:");
              try {
                pushLog(JSON.stringify(result, null, 2));
              } catch (e) {
                pushLog("❌ stringify full failed: " + e.message);
              }
            }
          } else {
            pushLog("⚠️ Result is not an object:");
            pushLog(result);
          }
        }),
        catchError((err) => {
          pushLog("❌ Account fetch failed.");
          pushLog(`🔍 err type: ${typeof err}`);
          pushLog(`🔍 err.toString(): ${String(err)}`);
          pushLog(`🔍 full err:`, err);
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  const getSymbolInfo = useCallback(() => {
    if (!adapter.current) {
      pushLog("⚠️ Not connected");
      return;
    }

    pushLog("📈 Fetching symbol info...");

    try {
      getSymbol(adapter.current, { symbolId: [1] })
        .pipe(
          take(1),
          tap((result) => {
            pushLog("✅ Symbol result received:");
            try {
              const symbolData = result?.payload?.payload;
              if (symbolData) {
                pushLog("📊 Symbol Payload:");
                pushLog(symbolData);
              } else {
                pushLog("⚠️ Symbol payload not found in response");
              }

              pushLog("🧾 Full symbol response:");
              pushLog(JSON.stringify(result, null, 2));
            } catch (e) {
              pushLog("💥 Error while processing symbol response:");
              pushLog(String(e));
            }
          }),
          catchError((err) => {
            pushLog("❌ Symbol fetch failed.");
            pushLog(`🔍 err type: ${typeof err}`);
            pushLog(`🔍 err.toString(): ${String(err)}`);
            pushLog(`🔍 full err:`, err);
            return [];
          })
        )
        .subscribe();
    } catch (e) {
      pushLog("💥 Sync error (symbol):");
      pushLog(String(e));
    }
  }, [pushLog]);

  return {
    connected,
    logs,
    getAccountInfo,
    getSymbolInfo
  };
};
