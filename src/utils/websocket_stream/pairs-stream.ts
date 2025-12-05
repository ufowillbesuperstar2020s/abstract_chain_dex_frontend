import { createWebSocketStream, type WebSocketStream } from './websocket-base';
import type { PairRealtimeUpdate } from '@/app/stores/pairs-store';

export type SubscribePairsArgs = {
  wsUrl: string;
  chainId: number;

  // NEW PARAMS FOR PING
  resolution: string;
  index: number;
  limit: number;
  order_by: string;
  filters: any;

  onMessage: (update: PairRealtimeUpdate) => void;
};

export type PairsStreamHandle = {
  sendPing: (params: { resolution: string; index: number; limit: number; order_by: string; filters: any }) => void;

  close: () => void;
};

type IncomingMessage = { type: 'PAIR_UPDATE'; data: PairRealtimeUpdate } | any;

export function subscribePairsStream({
  wsUrl,
  chainId,
  resolution,
  index,
  limit,
  order_by,
  filters,
  onMessage
}: SubscribePairsArgs): PairsStreamHandle {
  const stream: WebSocketStream<IncomingMessage> = createWebSocketStream({
    wsUrl,
    onData: (msg) => {
      if (msg?.type === 'PAIR_UPDATE') {
        onMessage(msg.data as PairRealtimeUpdate);
      }
    }
  });

  const sendPing = (params: { resolution: string; index: number; limit: number; order_by: string; filters: any }) => {
    stream.send({
      type: 'SUBSCRIBE_PAIRS',
      data: {
        chain_id: chainId,
        ...params
      }
    });
  };

  // send initial subscription
  sendPing({ resolution, index, limit, order_by, filters });

  const close = () => {
    stream.send({
      type: 'UNSUBSCRIBE_PAIRS',
      data: {
        chain_id: chainId
      }
    });

    stream.close();
  };

  return { sendPing, close };
}
