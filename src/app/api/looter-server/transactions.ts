import { http } from '@/utils/http';
import type { Transaction } from '@/types/trades';

// initial page (index 0)
export async function fetchSwapsByPair(pairAddress: string): Promise<Transaction[]> {
  const res = await http.get<Transaction[]>('/transactions', {
    params: {
      pair_address: pairAddress,
      tx_type: 'swap',
      index: 0,
      limit: 100
    }
  });
  return res.data;
}

// generic page fetcher
export async function fetchSwapsByPairPage(pairAddress: string, index: number, limit = 100): Promise<Transaction[]> {
  const res = await http.get<Transaction[]>('/transactions', {
    params: { pair_address: pairAddress, tx_type: 'swap', index, limit }
  });
  return res.data;
}
