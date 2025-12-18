import { createWebSocketStream, type WebSocketStream } from './websocket-base';
import type { PairRealtimeUpdate } from '@/app/stores/pairs-store';

type FiltersPayload = Record<string, string | number | boolean | undefined>;

export type SubscribePairsArgs = {
  wsUrl: string;
  chainId: number;
  resolution: string;
  index: number;
  limit: number;
  order_by: string;
  filters?: FiltersPayload;

  // Realtime updates from backend (PAIR_UPDATE)
  onMessage: (update: PairRealtimeUpdate) => void;
};

export type PairsStreamHandle = {
  sendPing: (params: {
    resolution: string;
    index: number;
    limit: number;
    order_by: string;
    filters?: FiltersPayload;
  }) => void;

  close: () => void;
};

type PairUpdateMessage = {
  type: 'PAIR_UPDATE';
  data: PairRealtimeUpdate;
};

type IncomingMessage = PairUpdateMessage | any;

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
    onData: (msg: IncomingMessage) => {
      if (Array.isArray(msg?.pairs)) {
        for (const pair of msg.pairs) {
          onMessage(pair as PairRealtimeUpdate);
        }
      }
    }
  });

  const buildDataFromParams = (params: {
    resolution: string;
    index: number;
    limit: number;
    order_by: string;
    filters?: FiltersPayload;
  }) => {
    const data: Record<string, string | number> = {
      resolution: params.resolution,
      index: params.index,
      limit: params.limit,
      order_by: params.order_by
    };

    if (params.filters) {
      for (const key of Object.keys(params.filters)) {
        const value = params.filters[key];
        if (value !== undefined && value !== null) {
          data[key] = String(value);
        }
      }
    }

    return data;
  };

  const sendPing = (params: {
    resolution: string;
    index: number;
    limit: number;
    order_by: string;
    filters?: FiltersPayload;
  }) => {
    const paramsData = buildDataFromParams(params);

    stream.send({
      type: 'SUBSCRIBE_PAIRS',
      data: {
        chain_id: chainId,
        params: paramsData
      }
    });
  };

  // initial subscription
  sendPing({ resolution, index, limit, order_by, filters });

  const close = () => {
    // best-effort unsubscribe
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
