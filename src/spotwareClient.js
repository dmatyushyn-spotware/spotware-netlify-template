import { SpotwareClientAdapter } from "@spotware-web-team/sdk";

export function initClient(onStatus) {
  const client = new SpotwareClientAdapter();

  client.onConnectionStatusChange((status) => {
    onStatus?.(status);
  });

  client.connect(); // или другой метод, см. SDK
}
