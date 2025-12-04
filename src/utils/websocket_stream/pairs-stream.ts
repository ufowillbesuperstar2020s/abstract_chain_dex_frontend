import { createWebSocketStream, type WebSocketStream } from './websocket-base';
import type { PairRealtimeUpdate } from '@/app/stores/pairs-store';

export type SubscribePairsArgs = {
  wsUrl: string;
  chainId: number;
  pairs: string[];
  onMessage: (update: PairRealtimeUpdate) => void;
};

export type PairsStreamHandle = {
  updatePairs: (pairs: string[]) => void;
  close: () => void;
};

export function subscribePairsStream({ wsUrl, chainId, pairs, onMessage }: SubscribePairsArgs): PairsStreamHandle {
  const stream: WebSocketStream<any> = createWebSocketStream({
    wsUrl,
    onData: (msg: any) => {
      if (msg?.type === 'PAIR_UPDATE') {
        onMessage(msg.data as PairRealtimeUpdate);
      }
    }
  });

  let currentPairs: string[] = [];

  const sendSubscribe = (next: string[]) => {
    if (!next.length) return;
    stream.send({
      type: 'SUBSCRIBE_PAIRS',
      data: {
        chain_id: chainId,
        pairs: next
      }
    });
  };

  const sendUnsubscribe = (prev: string[]) => {
    if (!prev.length) return;
    stream.send({
      type: 'UNSUBSCRIBE_PAIRS',
      data: {
        chain_id: chainId,
        pairs: prev
      }
    });
  };

  const updatePairs = (nextPairs: string[]) => {
    const normalizedNext = Array.from(new Set(nextPairs)); // dedupe

    const prevSet = new Set(currentPairs);
    const nextSet = new Set(normalizedNext);

    const toSubscribe: string[] = [];
    const toUnsubscribe: string[] = [];

    // new pairs to subscribe
    for (const p of nextSet) {
      if (!prevSet.has(p)) {
        toSubscribe.push(p);
      }
    }

    // old pairs to unsubscribe
    for (const p of prevSet) {
      if (!nextSet.has(p)) {
        toUnsubscribe.push(p);
      }
    }

    if (toUnsubscribe.length) {
      sendUnsubscribe(toUnsubscribe);
    }
    if (toSubscribe.length) {
      sendSubscribe(toSubscribe);
    }

    currentPairs = normalizedNext;
  };

  // send initial subscription
  if (pairs.length) {
    updatePairs(pairs);
  }

  const close = () => {
    if (currentPairs.length) {
      // best-effort unsubscribe before closing
      sendUnsubscribe(currentPairs);
    }
    stream.close();
    currentPairs = [];
  };

  return { updatePairs, close };
}
