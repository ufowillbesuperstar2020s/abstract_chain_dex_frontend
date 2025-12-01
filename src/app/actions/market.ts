'use server';

import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import type { MarketApiResponse } from '@/types/market';

const API_BASE =
  process.env.LOOTER_API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? 'https://server23.looter.ai/evm-chart-api/';

export async function fetchMarketDataFromApi(address: string): Promise<MarketApiResponse | null> {
  if (!address) {
    throw new Error('Token address is required');
  }

  try {
    const url = `${API_BASE}/api/info/market/${address}`;
    const res: AxiosResponse<MarketApiResponse> = await axios.get(url);
    if (res.status !== StatusCodes.OK) {
      throw new Error('Market API returned unsuccessful response');
    }

    return res.data;
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (axios.isAxiosError(err)) {
      message = err.response?.data ?? err.message;
      console.error('Swap quote error:', message);
    } else if (err instanceof Error) {
      message = err.message;
      console.error('Swap quote error:', message);
    } else {
      console.error('Swap quote unknown error:', err);
    }
    return null;
  }
}
