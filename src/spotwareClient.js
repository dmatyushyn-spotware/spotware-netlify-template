import { createClientAdapter } from '@spotware-web-team/sdk-external-api';
import { registerEvent, handleConfirmEvent, getAccountInformation } from '@spotware-web-team/sdk';
import { take, tap, catchError } from 'rxjs';
import { createLogger } from '@veksa/logger';

let client = null;

export const connect = async (setStatus, pushLog = () => {}) => {
  const logger = createLogger(true);
  client = createClientAdapter({ logger });

  setStatus('Connecting...');
  pushLog('⚡ Connecting to Spotware...');

  try {
    handleConfirmEvent(client, {}).pipe(take(1)).subscribe();

    registerEvent(client)
      .pipe(
        take(1),
        tap(() => {
          handleConfirmEvent(client, {}).pipe(take(1)).subscribe();
          setStatus('Connected');
          pushLog('✅ Connected to Spotware');
        }),
        catchError((err) => {
          setStatus('Connection failed');
          pushLog(`❌ Connection failed: ${err.message}`);
          return [];
        })
      )
      .subscribe();
  } catch (err) {
    setStatus('Connection error');
    pushLog(`❌ Connection error: ${err.message}`);
  }
};

export const fetchAccountInfo = async (pushLog = () => {}) => {
  if (!client) {
    pushLog('⚠️ Not connected');
    return;
  }

  pushLog('📡 Requesting account info...');
  getAccountInformation(client, {})
    .pipe(
      take(1),
      tap((info) => {
        pushLog(`📘 Account Info:\n${JSON.stringify(info, null, 2)}`);
      }),
      catchError((err) => {
        pushLog(`❌ Failed to fetch account info: ${err.message}`);
        return [];
      })
    )
    .subscribe();
};
