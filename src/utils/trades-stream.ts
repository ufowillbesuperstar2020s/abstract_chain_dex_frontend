type SubscribeOptions = {
  wsUrl: string;
  pairAddress: string;
  makeSubscribeMsg: (address: string) => any;
  makeUnsubscribeMsg?: (address: string) => any;
  onMessage: (msgData: any) => void;
};

// keep one socket per wsUrl
const sockets: Record<string, WebSocket> = {};

function getSocket(wsUrl: string): WebSocket {
  if (sockets[wsUrl]) return sockets[wsUrl];

  const socket = new WebSocket(wsUrl);
  socket.addEventListener('open', () => console.log('[trades-ws] connected:', wsUrl));
  socket.addEventListener('close', () => console.log('[trades-ws] closed:', wsUrl));
  socket.addEventListener('error', (e) => console.log('[trades-ws] error:', e));

  sockets[wsUrl] = socket;
  return socket;
}

/**
 * Subscribe trades stream for one pair.
 * Returns unsubscribe function.
 */
export function subscribeTradesStream(opts: SubscribeOptions): () => void {
  const { wsUrl, pairAddress, makeSubscribeMsg, makeUnsubscribeMsg, onMessage } = opts;

  const socket = getSocket(wsUrl);

  // send SUBSCRIBE when socket is ready
  if (typeof makeSubscribeMsg === 'function') {
    const msg = makeSubscribeMsg(pairAddress);
    const send = () => socket.send(JSON.stringify(msg));
    if (socket.readyState === WebSocket.OPEN) {
      send();
    } else {
      socket.addEventListener('open', send, { once: true });
    }
  }

  const handleMessage = (ev: MessageEvent) => {
    try {
      const raw = JSON.parse(ev.data as string);
      const list = Array.isArray(raw) ? raw : [raw];

      for (const d of list) {
        if (!d || d.timestamp == null) continue;

        // filter by pair if needed
        if (d.pair_address) {
          const fromServer = String(d.pair_address).toLowerCase();
          const current = pairAddress.toLowerCase();
          if (fromServer !== current) continue;
        }

        // pass the trade object itself to callback
        onMessage(d);
      }
    } catch (e) {
      console.warn('[trades-ws] parse error', e);
    }
  };

  socket.addEventListener('message', handleMessage);

  // cleanup
  return () => {
    socket.removeEventListener('message', handleMessage);

    if (typeof makeUnsubscribeMsg === 'function') {
      try {
        socket.send(JSON.stringify(makeUnsubscribeMsg(pairAddress)));
      } catch {
        // ignore
      }
    }
  };
}
