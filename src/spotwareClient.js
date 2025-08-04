import { FC, useCallback, useEffect, useRef, useState } from "react";
import { createClientAdapter, IExternalTransportAdapter } from "@spotware-web-team/sdk-external-api";
import {
    cancelOrder,
    closePosition,
    createNewOrder,
    executionEvent,
    getAccountGroupInformation,
    getAccountInformation,
    getDealList,
    getDynamicLeverage,
    getLightSymbolList,
    getSymbol,
    handleConfirmEvent,
    modifyOrder,
    modifyOrderProtection,
    quoteEvent,
    registerEvent,
    ServerInterfaces,
    subscribeQuotes,
    unsubscribeQuotes,
} from "@spotware-web-team/sdk";
import { catchError, take, tap } from "rxjs";
import { createLogger } from "@veksa/logger";

export const Example: FC = () => {
    const [connected, setConnected] = useState(false);
    const adapter = useRef<IExternalTransportAdapter>(null);

    const [logs, setLogs] = useState<string[]>([]);
    const [symbolId, setSymbolId] = useState<number>(1);
    const [quotesSymbolId, setQuotesSymbolId] = useState<number>(1);
    const [leverageId, setLeverageId] = useState<number>(1);
    const [newOrderSymbolId, setNewOrderSymbolId] = useState(1);
    const [newOrderVolume, setNewOrderVolume] = useState(100000);
    const [modifyOrderId, setModifyOrderId] = useState(1);
    const [modifyOrderVolume, setModifyOrderVolume] = useState(100000);
    const [modifyPositionId, setModifyPositionId] = useState(1);
    const [modifyStopLoss, setModifyStopLoss] = useState(0.1);
    const [modifyPrice, setModifyPrice] = useState(100);
    const [modifyTakeProfit, setModifyTakeProfit] = useState(0.1);
    const [cancelOrderId, setCancelOrderId] = useState(1);
    const [closePositionId, setClosePositionId] = useState(1);
    const [closePositionVolume, setClosePositionVolume] = useState(100000);

    useEffect(() => {
        const isLogEnabled = window.location.href.includes("showLogs");
        const logger = createLogger(isLogEnabled);

        adapter.current = createClientAdapter({ logger });

        if (isLogEnabled) {
            logger.info("Mounted");
        }

        handleConfirmEvent(adapter.current, {}).pipe(take(1)).subscribe();

        registerEvent(adapter.current)
            .pipe(
                take(1),
                tap(() => {
                    handleConfirmEvent(adapter.current, {}).pipe(take(1)).subscribe();
                    setConnected(true);
                }),
                catchError(() => {
                    setLogs(prevLogs => [...prevLogs, "❌ Error host connection"]);
                    return [];
                })
            )
            .subscribe();
    }, []);

    const logResult = (prefix: string, result: any) => {
        const msg = typeof result === "string" ? result : JSON.stringify(result, null, 2);
        setLogs(prevLogs => [...prevLogs, `${prefix}: ${msg}`]);
    };

    const handleAccountInformation = useCallback(() => {
        getAccountInformation(adapter.current, {}).pipe(
            take(1),
            tap(result => logResult("ℹ️ Account Info", result))
        ).subscribe();
    }, []);

    const handleAccountGroupInformation = useCallback(() => {
        getAccountGroupInformation(adapter.current, {}).pipe(
            take(1),
            tap(result => logResult("ℹ️ Account Group Info", result))
        ).subscribe();
    }, []);

    const handleLightSymbolList = useCallback(() => {
        getLightSymbolList(adapter.current, {}).pipe(
            take(1),
            tap(result => logResult("📄 Light Symbol List", result))
        ).subscribe();
    }, []);

    const handleSymbol = useCallback(() => {
        getSymbol(adapter.current, { symbolId: [symbolId] }).pipe(
            take(1),
            tap(result => logResult("📊 Symbol Info", result))
        ).subscribe();
    }, [symbolId]);

    const handleSubscribeQuotes = useCallback(() => {
        subscribeQuotes(adapter.current, { symbolId: [quotesSymbolId] }).pipe(
            take(1),
            tap(result => logResult("🔔 Subscribed Quotes", result))
        ).subscribe();
    }, [quotesSymbolId]);

    const handleUnsubscribeQuotes = useCallback(() => {
        unsubscribeQuotes(adapter.current, { symbolId: [quotesSymbolId] }).pipe(
            take(1),
            tap(result => logResult("🔕 Unsubscribed Quotes", result))
        ).subscribe();
    }, [quotesSymbolId]);

    const handleDynamicLeverage = useCallback(() => {
        getDynamicLeverage(adapter.current, { leverageId }).pipe(
            take(1),
            tap(result => logResult("⚖️ Dynamic Leverage", result))
        ).subscribe();
    }, [leverageId]);

    const handleDealList = useCallback(() => {
        getDealList(adapter.current, { fromTimestamp: 0, toTimestamp: Date.now() }).pipe(
            take(1),
            tap(result => logResult("📜 Deal List", result))
        ).subscribe();
    }, []);

    // 🔑 Основная логика createNewOrder с логированием ошибок и успеха
    const handleCreateNewOrder = useCallback(() => {
        createNewOrder(adapter.current, {
            symbolId: newOrderSymbolId,
            orderType: ServerInterfaces.ProtoOrderType.MARKET,
            tradeSide: ServerInterfaces.ProtoTradeSide.BUY,
            volume: newOrderVolume,
        }).pipe(
            tap(result => {
                const payloadType = result?.payloadType;
                if (payloadType === 138) { // PROTO_ORDER_ERROR_EVENT
                    logResult("❌ Order Error", result);
                } else {
                    logResult("✅ Order Created", result);
                }
            })
        ).subscribe();
    }, [newOrderSymbolId, newOrderVolume]);

    const handleModifyOrder = useCallback(() => {
        modifyOrder(adapter.current, {
            orderId: modifyOrderId,
            limitPrice: modifyPrice,
            volume: modifyOrderVolume,
        }).pipe(
            tap(result => logResult("✏️ Order Modified", result))
        ).subscribe();
    }, [modifyOrderId, modifyOrderVolume, modifyPrice]);

    const handleModifyOrderProtection = useCallback(() => {
        modifyOrderProtection(adapter.current, {
            positionId: modifyPositionId,
            stopLoss: modifyStopLoss,
            takeProfit: modifyTakeProfit,
        }).pipe(
            tap(result => logResult("🛡️ Order Protection Modified", result))
        ).subscribe();
    }, [modifyPositionId, modifyStopLoss, modifyTakeProfit]);

    const handleCancelOrder = useCallback(() => {
        cancelOrder(adapter.current, {
            orderId: cancelOrderId,
        }).pipe(
            tap(result => logResult("🚫 Order Canceled", result))
        ).subscribe();
    }, [cancelOrderId]);

    const handleClosePosition = useCallback(() => {
        closePosition(adapter.current, {
            positionId: closePositionId,
            volume: closePositionVolume,
        }).pipe(
            tap(result => logResult("🔒 Position Closed", result))
        ).subscribe();
    }, [closePositionId, closePositionVolume]);

    useEffect(() => {
        if (connected) {
            quoteEvent(adapter.current).pipe(
                tap(result => logResult("💬 Quote Event", result))
            ).subscribe();

            executionEvent(adapter.current).pipe(
                tap(result => logResult("📬 Execution Event", result))
            ).subscribe();
        }
    }, [connected]);

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "10px", overflow: "auto", backgroundColor: "#fff", color: "#000" }}>
            <div style={{ display: "flex", alignItems: "flex-start", flexDirection: "column", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                <button disabled={!connected} onClick={handleAccountInformation}>getAccountInformation</button>
                <button disabled={!connected} onClick={handleAccountGroupInformation}>getAccountGroupInformation</button>
                <button disabled={!connected} onClick={handleLightSymbolList}>getLightSymbolList</button>

                <div>
                    <button disabled={!connected} onClick={handleSymbol}>getSymbol</button>
                    <span style={{ marginLeft: 5 }}>symbolId:</span>
                    <input style={{ width: 30 }} value={symbolId} onChange={e => setSymbolId(Number(e.target.value))} />
                </div>

                <div>
                    <button disabled={!connected} onClick={handleSubscribeQuotes}>subscribeQuotes</button>
                    <span style={{ marginLeft: 5 }}>symbolId:</span>
                    <input style={{ width: 30 }} value={quotesSymbolId} onChange={e => setQuotesSymbolId(Number(e.target.value))} />
                </div>

                <div>
                    <button disabled={!connected} onClick={handleUnsubscribeQuotes}>unsubscribeQuotes</button>
                    <span style={{ marginLeft: 5 }}>symbolId:</span>
                    <input style={{ width: 30 }} value={quotesSymbolId} onChange={e => setQuotesSymbolId(Number(e.target.value))} />
                </div>

                <div>
                    <button disabled={!connected} onClick={handleDynamicLeverage}>getDynamicLeverage</button>
                    <span style={{ marginLeft: 5 }}>leverageId:</span>
                    <input style={{ width: 30 }} value={leverageId} onChange={e => setLeverageId(Number(e.target.value))} />
                </div>

                <button disabled={!connected} onClick={handleDealList}>getDealList</button>

                <div>
                    <button disabled={!connected} onClick={handleCreateNewOrder}>createNewOrder</button>
                    <span style={{ marginLeft: 5 }}>symbolId:</span>
                    <input style={{ width: 30 }} value={newOrderSymbolId} onChange={e => setNewOrderSymbolId(Number(e.target.value))} />
                    <span style={{ marginLeft: 5 }}>volume:</span>
                    <input style={{ width: 50 }} value={newOrderVolume} onChange={e => setNewOrderVolume(Number(e.target.value))} />
                </div>

                <div>
                    <button disabled={!connected} onClick={handleModifyOrder}>modifyOrder</button>
                    <span style={{ marginLeft: 5 }}>orderId:</span>
                    <input style={{ width: 30 }} value={modifyOrderId} onChange={e => setModifyOrderId(Number(e.target.value))} />
                    <span style={{ marginLeft: 5 }}>volume:</span>
                    <input style={{ width: 50 }} value={modifyOrderVolume} onChange={e => setModifyOrderVolume(Number(e.target.value))} />
                    <span style={{ marginLeft: 5 }}>modify price:</span>
                    <input style={{ width: 30 }} value={modifyPrice} onChange={e => setModifyPrice(Number(e.target.value))} />
                </div>

                <div>
                    <button disabled={!connected} onClick={handleModifyOrderProtection}>modifyOrderProtection</button>
                    <span style={{ marginLeft: 5 }}>positionId:</span>
                    <input style={{ width: 30 }} value={modifyPositionId} onChange={e => setModifyPositionId(Number(e.target.value))} />
                    <span style={{ marginLeft: 5 }}>stop loss:</span>
                    <input style={{ width: 30 }} value={modifyStopLoss} onChange={e => setModifyStopLoss(Number(e.target.value))} />
                    <span style={{ marginLeft: 5 }}>takeProfit:</span>
                    <input style={{ width: 30 }} value={modifyTakeProfit} onChange={e => setModifyTakeProfit(Number(e.target.value))} />
                </div>

                <div>
                    <button disabled={!connected} onClick={handleCancelOrder}>cancelOrder</button>
                    <span style={{ marginLeft: 5 }}>orderId:</span>
                    <input style={{ width: 30 }} value={cancelOrderId} onChange={e => setCancelOrderId(Number(e.target.value))} />
                </div>

                <div>
                    <button disabled={!connected} onClick={handleClosePosition}>closePosition</button>
                    <span style={{ marginLeft: 5 }}>positionId:</span>
                    <input style={{ width: 30 }} value={closePositionId} onChange={e => setClosePositionId(Number(e.target.value))} />
                    <span style={{ marginLeft: 5 }}>volume:</span>
                    <input style={{ width: 50 }} value={closePositionVolume} onChange={e => setClosePositionVolume(Number(e.target.value))} />
                </div>
            </div>

            <div style={{ height: "100%", overflowY: "scroll", minHeight: 200 }}>
                {logs.map((log, index) => (
                    <div key={index} style={{ marginBottom: "10px" }}>{log}</div>
                ))}
            </div>
        </div>
    );
};
