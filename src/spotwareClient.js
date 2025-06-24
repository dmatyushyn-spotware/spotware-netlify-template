import {
  registerEvent,
  handleConfirmEvent,
  getAccountInformation
} from '@spotware-web-team/sdk';

import { createClientAdapter } from '@spotware-web-team/sdk-external-api';
import { createLogger } from '@veksa/logger';

import { take, tap, catchError } from 'rxjs';

let adapter = null;

// Экспортируемая функция для подключения
export function connect(setStatus, setConnected, pushLog) {
  const logger = createLogger(true);
  adapter = createClientAdapter({ logger });

  setStatus('Connecting...');
  pushLog('⚡ Connecting to Spotware...');

  // Подтверждение клиента
  handleConfirmEvent(adapter, {})
    .pipe(take(1))
    .subscribe(event => {
      pushLog(`✅ Confirmed: ${JSON.stringify(event)}`);
    });

  // Регистрация событий
  registerEvent(adapter)
    .pipe(
      take(1),
      tap(() => {
        handleConfirmEvent(adapter, {}).pipe(take(1)).subscribe(event => {
          pushLog(`📩 Session confirmed again: ${JSON.stringify(event)}`);
        });

        setConnected(true);
        setStatus('Connected');
        pushLog('🎉 Connected to Spotware.');
      }),
      catchError(err => {
        pushLog(`❌ Registration failed: ${err.message}`);
        setStatus('Connection error');
        return [];
      })
    )
    .subscribe();
}

// Получение информации по аккаунту
export function fetchAccountInfo(pushLog) {
  if (!adapter) {
    pushLog('⚠️ Not connected. Call connect() first.');
    return;
  }

  getAccountInformation(adapter, {})
    .pipe(
      take(1),
      tap(info => {
        pushLog(`📘 Account Info:\n${JSON.stringify(info, null, 2)}`);
      }),
      catchError(err => {
        pushLog(`❌ Failed to fetch account info: ${err.message}`);
        return [];
      })
    )
    .subscribe();
}
