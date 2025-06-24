import {
  createClientAdapter,
  IExternalTransportAdapter
} from "@spotware/external-api";
import {
  getAccountInformation,
  handleConfirmEvent,
  registerEvent,
  ProtoOAClientSessionEvent
} from "@spotware/sdk";
import { tap, take, filter } from "rxjs";
import { createLogger } from "@veksa/logger";

let adapter = null;
let loggerCallback = null;
let onConnectedCallback = null;

// Логгер, в который можно в любой момент дописать функцию
const logger = createLogger(true);
logger.log = (msg, ...args) => {
  console.log(msg, ...args);
  if (loggerCallback) loggerCallback(`${msg} ${args.join(" ")}`);
};

export const setLogger = (callback) => {
  loggerCallback = callback;
};

export const connect = (onConnected) => {
  adapter = createClientAdapter({ logger });
  onConnectedCallback = onConnected;

  loggerCallback?.("🔌 Connecting to Spotware...");

  handleConfirmEvent(adapter, {}).pipe(take(1)).subscribe();

  registerEvent(adapter)
    .pipe(
      tap((evt) => {
        loggerCallback?.(`📥 Incoming event: ${JSON.stringify(evt, null, 2)}`);

        if (evt.payloadType === ProtoOAClientSessionEvent) {
          loggerCallback?.("✅ Session established (ProtoOAClientSessionEvent)");

          onConnectedCallback?.(); // Установлено соединение
        }
      })
    )
    .subscribe();
};

export const fetchAccountInfo = () => {
  if (!adapter) {
    loggerCallback?.("❌ Not connected");
    return;
  }

  getAccountInformation(adapter, {})
    .pipe(
      take(1),
      tap((result) => {
        loggerCallback?.(`📄 Account Info: ${JSON.stringify(result, null, 2)}`);
      })
    )
    .subscribe();
};
