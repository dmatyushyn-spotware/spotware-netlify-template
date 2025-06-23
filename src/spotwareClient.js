import { createClientAdapter } from "@spotware-web-team/sdk";

export function initClient(onStatus) {
  const client = createClientAdapter();

  client.onConnect = () => onStatus("Connected!");
  client.onError = (e) => onStatus(`Error: ${e.message || e}`);

  client.connect();
  return client;
}
