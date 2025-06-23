import { createClientAdapter } from '@spotware-web-team/sdk-external-api';
import { confirmEvent, registerEvent } from '@spotware-web-team/sdk';
import { mergeMap, tap, catchError } from 'rxjs';

const clientApi = createClientAdapter();

registerEvent(clientApi).pipe(
  mergeMap(() => confirmEvent(clientApi)),
  tap(() => {
    console.log('Connected');
  }),
  catchError((err) => {
    console.error('Connection failed:', err);
    return []; // or EMPTY
  })
).subscribe();
