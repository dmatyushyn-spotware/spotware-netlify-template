import SpotwareClient from "@spotware-web-team/sdk";

export function initClient(onStatus) {
  const client = new SpotwareClient();

  client.onConnectionStatusChange((status) => {
    onStatus?.(status);
  });

  client.connect(); // или другой метод, зависит от API
}
