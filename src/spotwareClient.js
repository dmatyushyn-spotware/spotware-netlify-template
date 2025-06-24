import { createClientAdapter } from '@spotware-web-team/sdk-external-api';
import { registerEvent, handleConfirmEvent, getAccountInformation } from '@spotware-web-team/sdk';
import { take, tap, catchError } from 'rxjs';
import { createLogger } from '@veksa/logger';

let client = null;

export const connect = async (setStatus = () => {}, pushLog = () => {}) => {
  const logger = createLogger(true);
  client = createClientAdapter({ logger });

  try {
    handleConfirmEvent(client, {})
      .pipe(take(1))
      .subscribe();

    registerEvent(client)
      .pipe(
        take(1),
        tap(() => {
          handleConfirmEvent(client, {}).pipe(take(1)).subscribe();
          console.log('Connected');
          setStatus('Connected');
          pushLog('✅ Connected to Spotware');
        }),
        catchError((error) => {
          console.error('Connection failed:', error);
          setStatus('Connection failed');
          pushLog('❌ Connection failed');
          return [];
        })
      )
      .subscribe();
  } catch (err) {
    console.error('Connection error:', err);
    setStatus('Connection error');
    pushLog('❌ Connection error');
  }
};

export const fetchAccountInfo = (pushLog = () => {}) => {
  if (!client) {
    pushLog('⚠️ Not connected');
    return;
  }

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
