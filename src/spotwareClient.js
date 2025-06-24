import {
  registerEvent,
  handleConfirmEvent,
  getAccountInformation
} from '@spotware-web-team/sdk';
import { createClientAdapter } from '@spotware-web-team/external-api';
import { createLogger } from '@veksa/logger';
import { take, tap, catchError } from 'rxjs';

let adapter = null;

export const logs = [];

export function connect(setStatus, setConnected, pushLog) {
  const logger = createLogger(true);
  adapter = createClientAdapter({ logger });

  setStatus('Connecting...');
  pushLog('⚡ Connecting to Spotware...');

  handleConfirmEvent(adapter, {})
    .pipe(take(1))
    .subscribe(event => {
      pushLog(`✅ Confirm Event Received: ${JSON.stringify(event)}`);
    });

  registerEvent(adapter)
    .pipe(
      take(1),
      tap(() => {
        handleConfirmEvent(adapter, {})
          .pipe(take(1))
          .subscribe(event => {
            pushLog(`✅ Second Confirm: ${JSON.stringify(event)}`);
          });

        setConnected(true);
        setStatus('Connected');
        pushLog('🎉 Connected to Spotware.');
      }),
      catchError(() => {
        pushLog('❌ Error during registration to Spotware.');
        setStatus('Connection error');
        return [];
      })
    )
    .subscribe();
}

export function fetchAccountInfo(pushLog) {
  if (!adapter) {
    pushLog('⚠️ Not connected to Spotware.');
    return;
  }

  getAccountInformation(adapter, {})
    .pipe(
      take(1),
      tap(info => {
        pushLog(`📘 Account Info: ${JSON.stringify(info, null, 2)}`);
      }),
      catchError(err => {
        pushLog(`❌ Failed to fetch account info: ${err}`);
        return [];
      })
    )
    .subscribe();
}
