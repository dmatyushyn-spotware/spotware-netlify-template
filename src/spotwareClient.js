import { useEffect, useRef, useState, useCallback } from "react";
import { createClientAdapter } from "@spotware-web-team/sdk-external-api";
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation,
  getSymbol,
  createNewOrder,
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

  // Подключение к Spotware
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

  // Получение информации о счете
  const getAccountInfo = useCallback(() => {
    if (!adapter.current) {
      pushLog("⚠️ Not connected");
      return;
    }

    pushLog("📰 [STEP 1] Starting getAccountInformation");

    let observable;

    try {
      observable = getAccountInformation(adapter.current, {});
      pushLog("✅ [STEP 2] getAccountInformation returned");
    } catch (e) {
      pushLog("💥 [STEP 2.1] Exception during getAccountInformation:");
      pushLog(e.message || String(e));
      return;
    }

    if (!observable || typeof observable.pipe !== "function") {
      pushLog("❌ [STEP 3] Invalid observable returned");
      pushLog(observable);
      return;
    }

    pushLog("🔁 [STEP 4] Starting pipe/subscribe");

    observable
      .pipe(
        take(1),
        tap((result) => {
          pushLog("📥 [STEP 5] tap() triggered");

          try {
            const json = JSON.stringify(result);
            pushLog("✅ [STEP 5.1] First 180 chars: " + json.slice(0, 180));
          } catch (e) {
            pushLog("❌ [STEP 5.2] JSON.stringify failed:");
            pushLog(e.message);
          }

          const trader = result?.payload?.payload?.Trader;
          if (trader) {
            pushLog("👤 [STEP 5.3] Trader info found:");
            pushLog(trader);
          } else {
            pushLog("⚠️ [STEP 5.4] Trader field missing");
          }
        }),
        catchError((err) => {
          pushLog("❌ [STEP 6] catchError triggered");
          pushLog(`🔍 err type: ${typeof err}`);
          pushLog(`🔍 err.toString(): ${String(err)}`);
          pushLog(`🔍 full err: ${JSON.stringify(err, null, 2)}`);
          return [];
        })
      )
      .subscribe(() => {
        pushLog("📤 [STEP 7] subscribe completed");
      });
  }, [pushLog]);

  // Получение информации о символе
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
            pushLog(`🔍 full err: ${JSON.stringify(err, null, 2)}`);
            return [];
          })
        )
        .subscribe();
    } catch (e) {
      pushLog("💥 Sync error (symbol):");
      pushLog(String(e));
    }
  }, [pushLog]);

  // Функция для создания маркетного ордера
  const createMarketOrder = useCallback((symbolId, volume, tradeSide) => {
    if (!adapter.current) {
      pushLog("⚠️ Not connected");
      return;
    }

    pushLog("📦 Creating market order...");

createNewOrder(adapter.current, {
  symbolId,
  orderType: "MARKET",
  tradeSide,
  volume,
})
  .pipe(take(1))
  .subscribe({
    next: (result) => pushLog("📥 NEXT: " + JSON.stringify(result, null, 2)),
    error: (err) => pushLog("💥 ERROR: " + String(err)),
    complete: () => pushLog("🏁 COMPLETE: Stream ended"),
  });

  return {
    connected,
    logs,
    getAccountInfo,
    getSymbolInfo,
    createMarketOrder,
  };
};
