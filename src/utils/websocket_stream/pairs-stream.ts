export function subscribePairsStream({ wsUrl, chainId, pairs, onMessage }) {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: 'SUBSCRIBE_PAIRS',
        data: { chain_id: chainId, pairs }
      })
    );
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'PAIR_UPDATE') {
        onMessage(msg.data);
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  };

  return () => ws.close();
}
