import { http } from '@/utils/http';
import type { Transaction } from '@/types/trades';

export async function fetchSwapsByPair(pairAddress: string): Promise<Transaction[]> {
  const res = await http.get<Transaction[]>('/transactions', {
    params: {
      pair_address: pairAddress,
      tx_type: 'swap',
      limit: 200
    }
  });
  return res.data;
}
