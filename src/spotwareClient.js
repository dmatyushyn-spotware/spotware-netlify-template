import { createClientAdapter } from "@spotware-web-team/sdk-external-api";

export function initClient(onStatus) {
  const client = createClientAdapter();

  client.onConnect = () => onStatus("✅ Connected");
  client.onError = (err) => onStatus(`❌ Error: ${err.message || err}`);

  client.connect();
  return client;
}

