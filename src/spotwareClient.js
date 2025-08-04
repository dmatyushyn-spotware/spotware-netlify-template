import { useEffect, useRef, useState, useCallback } from "react";
import { createClientAdapter } from "@spotware-web-team/sdk-external-api";
import {
  handleConfirmEvent,
  registerEvent,
  getAccountInformation,
  getSymbol,
  createNewOrder,
  executionEvent,
  ServerInterfaces
} from "@spotware-web-team/sdk";
import { createLogger } from "@veksa/logger";
import { take, tap, catchError } from "rxjs";

export const useSpotwareClient = () => {
  const adapter = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const pushLog = useCallback((msg: any, obj: any = null) => {
    if (typeof msg === "object") {
      setLogs((prev) => [...prev, JSON.stringify(msg, null, 2)]);
    } else {
      setLogs((prev) => [...prev, String(msg)]);
    }
    if (obj) {
      setLogs((prev) => [...prev, JSON.stringify(obj, null, 2)]);
    }
  }, []);

  // Подключение
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

  // Подписка на исполнение ордеров
  useEffect(() => {
    if (connected && adapter.current) {
      executionEvent(adapter.current)
        .pipe(
          tap((event) => {
            const status = event?.payload?.payload?.executionType;
            pushLog(`📬 Execution event received (Status: ${status})`);
            pushLog(event);
          }),
          catchError((err) => {
            pushLog("❌ Error while listening to executionEvent:");
            pushLog(String(err));
            return [];
          })
        )
        .subscribe();
    }
  }, [connected, pushLog]);

  // Получение информации о счете
  const getAccountInfo = useCallback(() => {
    if (!adapter.current) {
      pushLog("⚠️ Not connected");
      return;
    }

    pushLog("📰 Starting getAccountInformation");

    let observable;

    try {
      observable = getAccountInformation(adapter.current, {});
      pushLog("✅ getAccountInformation returned");
    } catch (e: any) {
      pushLog("💥 Exception during getAccountInformation:");
      pushLog(e.message || String(e));
      return;
    }

    if (!observable || typeof observable.pipe !== "function") {
      pushLog("❌ Invalid observable returned");
      pushLog(observable);
      return;
    }

    pushLog("🔁 Subscribing to observable");

    observable
      .pipe(
        take(1),
        tap((result) => {
          pushLog("📥 Account info received:");
          try {
            const json = JSON.stringify(result);
            pushLog("✅ First 180 chars: " + json.slice(0, 180));
          } catch (e: any) {
            pushLog("❌ JSON.stringify failed:");
            pushLog(e.message);
          }

          const trader = result?.payload?.payload?.Trader;
          if (trader) {
            pushLog("👤 Trader info:");
            pushLog(trader);
          } else {
            pushLog("⚠️ Trader field missing");
          }
        }),
        catchError((err) => {
          pushLog("❌ Error fetching account info:");
          pushLog(String(err));
          return [];
        })
      )
      .subscribe(() => {
        pushLog("📤 Account info subscribe completed");
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
            pushLog("✅ Symbol info received:");
            try {
              const symbolData = result?.payload?.payload;
              if (symbolData) {
                pushLog("📊 Symbol Payload:");
                pushLog(symbolData);
              } else {
                pushLog("⚠️ Symbol payload not found");
              }
              pushLog("🧾 Full symbol response:");
              pushLog(result);
            } catch (e: any) {
              pushLog("💥 Error processing symbol response:");
              pushLog(String(e));
            }
          }),
          catchError((err) => {
            pushLog("❌ Symbol fetch failed:");
            pushLog(String(err));
            return [];
          })
        )
        .subscribe();
    } catch (e: any) {
      pushLog("💥 Sync error fetching symbol:");
      pushLog(String(e));
    }
  }, [pushLog]);

  // Создание маркетного ордера (BUY/SELL)
  const createMarketOrder = useCallback((symbolId: number, volume: number, side: "BUY" | "SELL") => {
    if (!adapter.current) {
      pushLog("⚠️ Not connected");
      return;
    }

    pushLog(`📦 Creating ${side} market order...`);

    createNewOrder(adapter.current, {
      symbolId: symbolId,
      orderType: ServerInterfaces.ProtoOrderType.MARKET,
      tradeSide:
        side === "BUY"
          ? ServerInterfaces.ProtoTradeSide.BUY
          : ServerInterfaces.ProtoTradeSide.SELL,
      volume: volume,
    })
      .pipe(
        take(1),
        tap((result) => {
          pushLog("✅ Server confirmed order creation:");
          pushLog(result);
        }),
        catchError((err) => {
          pushLog("❌ Error while creating market order:");
          pushLog(String(err));
          return [];
        })
      )
      .subscribe();
  }, [pushLog]);

  return {
    connected,
    logs,
    getAccountInfo,
    getSymbolInfo,
    createMarketOrder,
  };
};
