export type WebSocketStreamArgs<TMessage = unknown> = {
  wsUrl: string;
  subscribeMessage: unknown;
  /** Optional: some streams may not need an explicit unsubscribe message */
  unsubscribeMessage?: unknown;
  onData?: (msg: TMessage) => void;
};

export function createWebSocketStream<TMessage = unknown>({
  wsUrl,
  subscribeMessage,
  unsubscribeMessage,
  onData
}: WebSocketStreamArgs<TMessage>) {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify(subscribeMessage));
  };

  ws.onmessage = (ev: MessageEvent) => {
    try {
      const msg = JSON.parse(ev.data as string) as TMessage;
      onData?.(msg);
    } catch (e) {
      console.error('WS parse error', e);
    }
  };

  const unsubscribe = () => {
    try {
      if (unsubscribeMessage != null) {
        ws.send(JSON.stringify(unsubscribeMessage));
      }
    } catch {
      // ignore send errors on close
    }
    ws.close();
  };

  return unsubscribe;
}
