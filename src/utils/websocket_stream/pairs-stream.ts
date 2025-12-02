import { createWebSocketStream } from './websocket-base';
import type { PairRealtimeUpdate } from '@/app/stores/pairs-store';

export type SubscribePairsArgs = {
  wsUrl: string;
  chainId: number;
  pairs: string[];
  onMessage: (update: PairRealtimeUpdate) => void;
};

export function subscribePairsStream({ wsUrl, chainId, pairs, onMessage }: SubscribePairsArgs) {
  return createWebSocketStream({
    wsUrl,

    subscribeMessage: {
      type: 'SUBSCRIBE_PAIRS',
      data: {
        chain_id: chainId,
        pairs
      }
    },

    unsubscribeMessage: {
      type: 'UNSUBSCRIBE_PAIRS',
      data: {
        chain_id: chainId,
        pairs
      }
    },

    onData: (msg: any) => {
      if (msg?.type === 'PAIR_UPDATE') {
        onMessage(msg.data as PairRealtimeUpdate);
      }
    }
  });
}
