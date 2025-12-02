export function createWebSocketStream({ wsUrl, subscribeMessage, unsubscribeMessage, onData }) {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify(subscribeMessage));
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      onData?.(msg);
    } catch (e) {
      console.error('WS parse error', e);
    }
  };

  const unsubscribe = () => {
    try {
      ws.send(JSON.stringify(unsubscribeMessage));
    } catch {}
    ws.close();
  };

  return unsubscribe;
}
