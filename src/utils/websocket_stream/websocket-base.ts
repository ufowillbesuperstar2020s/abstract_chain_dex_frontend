export type WebSocketStreamArgs<TMessage = unknown> = {
  wsUrl: string;
  onData?: (msg: TMessage) => void;
};

export type WebSocketStream<TMessage = unknown> = {
  send: (message: TMessage) => void;
  close: () => void;
  getState: () => number;
};

export function createWebSocketStream<TMessage = unknown>({
  wsUrl,
  onData
}: WebSocketStreamArgs<TMessage>): WebSocketStream<TMessage> {
  const ws = new WebSocket(wsUrl);

  // Queue messages while the socket is connecting so callers can freely call send() before the connection is fully open.
  const pendingMessages: string[] = [];

  const flushQueue = () => {
    if (ws.readyState === WebSocket.OPEN && pendingMessages.length > 0) {
      for (const msg of pendingMessages) {
        ws.send(msg);
      }
      pendingMessages.length = 0;
    }
  };

  ws.onopen = () => {
    flushQueue();
  };

  ws.onmessage = (ev: MessageEvent) => {
    try {
      const msg = JSON.parse(ev.data as string) as TMessage;
      onData?.(msg);
    } catch (e) {
      console.error('WS parse error', e);
    }
  };

  const send = (message: unknown) => {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    } else if (ws.readyState === WebSocket.CONNECTING) {
      pendingMessages.push(payload);
    } else {
      console.warn('Attempted to send on a closed WebSocket');
    }
  };

  const close = () => {
    try {
      ws.close();
    } catch {}
  };

  const getState = () => ws.readyState;

  return { send, close, getState };
}
