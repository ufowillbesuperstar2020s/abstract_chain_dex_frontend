import { createWebSocketStream } from './websocket-base';

export function subscribePairsStream({ wsUrl, chainId, pairs, onMessage }) {
  return createWebSocketStream({
    wsUrl,
    subscribeMessage: {
      type: 'SUBSCRIBE_PAIRS',
      data: { chain_id: chainId, pairs }
    },
    unsubscribeMessage: {
      type: 'UNSUBSCRIBE_PAIRS',
      data: { chain_id: chainId, pairs }
    },
    onData: (msg) => {
      if (msg.type === 'PAIR_UPDATE') onMessage(msg.data);
    }
  });
}
