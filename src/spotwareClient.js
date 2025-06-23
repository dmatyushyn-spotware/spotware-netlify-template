import { FC, useCallback, useEffect, useRef, useState } from "react";
import { createClientAdapter, IExternalTransportAdapter } from "@spotware/external-api";
import {
  getAccountInformation,
  handleConfirmEvent,
  registerEvent
} from "@spotware/sdk";
import { catchError, take, tap } from "rxjs";
import { createLogger } from "@veksa/logger";

export const Example: FC = () => {
  const [connected, setConnected] = useState(false);
  const adapter = useRef<IExternalTransportAdapter>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const logger = createLogger(true);
    adapter.current = createClientAdapter({ logger });

    // confirm initial connection
    handleConfirmEvent(adapter.current, {}).pipe(take(1)).subscribe();

    registerEvent(adapter.current).pipe(
      take(1),
      tap(() => {
        handleConfirmEvent(adapter.current, {}).pipe(take(1)).subscribe();

        // ✅ Теперь можно запрашивать информацию об аккаунте
        getAccountInformation(adapter.current, {}).pipe(
          take(1),
          tap(result => {
            setLogs(prevLogs => [...prevLogs, 'ACCOUNT INFO:\n' + JSON.stringify(result, null, 2)]);
          })
        ).subscribe();

        setConnected(true);
      }),
      catchError((err) => {
        setLogs(prevLogs => [...prevLogs, 'Error host connection: ' + err]);
        return [];
      })
    ).subscribe();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Spotware Client Status</h1>
      <p><strong>Status:</strong> {connected ? "Connected" : "Not connected"}</p>
      <div style={{ marginTop: "20px" }}>
        {logs.map((log, index) => (
          <pre key={index} style={{ background: "#f4f4f4", padding: "10px", borderRadius: "4px", marginBottom: "10px" }}>
            {log}
          </pre>
        ))}
      </div>
    </div>
  );
};
