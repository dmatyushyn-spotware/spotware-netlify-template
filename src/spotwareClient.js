import { createClientAdapter } from '@spotware-web-team/sdk-external-api';
import { confirmEvent, registerEvent } from '@spotware-web-team/sdk';
import { mergeMap, tap, catchError } from 'rxjs';

let client = null;

export const connect = async (setStatus = () => {}) => {
  try {
    client = createClientAdapter();
    if (!client) {
      console.error('Client creation failed');
      setStatus('Client creation failed');
      return;
    }

    console.log('Client created:', client);

    confirmEvent(client)
      .pipe(
        mergeMap(() => []), // либо tap(() => { ... }) если нужна логика
        catchError((err) => {
          console.error('Confirm event failed:', err);
          setStatus('Confirm event failed');
          return [];
        })
      )
      .subscribe();

    registerEvent(client)
      .pipe(
        mergeMap(() => []),
        tap(() => {
          console.log('Connected');
          setStatus('Connected');
        }),
        catchError((err) => {
          console.error('Register event failed:', err);
          setStatus('Register event failed');
          return [];
        })
      )
      .subscribe();

  } catch (err) {
    console.error('Connection error:', err);
    setStatus('Connection error');
  }
};
