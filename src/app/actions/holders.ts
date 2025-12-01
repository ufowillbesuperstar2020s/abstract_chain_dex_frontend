'use server';

import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import type { RawHolder } from '@/utils/formatHolders';

const HOLDERS_API_BASE =
  process.env.LOOTER_HOLDERS_API_BASE ??
  process.env.LOOTER_API_BASE ??
  process.env.NEXT_PUBLIC_API_BASE ??
  'https://server23.looter.ai/evm-chart-api/';

export async function fetchHoldersFromApi(tokenAddress: string): Promise<RawHolder[]> {
  if (!tokenAddress) {
    throw new Error('Token address is required');
  }

  try {
    const url = `${HOLDERS_API_BASE}/api/info/holders/${tokenAddress}`;
    const res: AxiosResponse<RawHolder[]> = await axios.get(url);

    if (res.status !== StatusCodes.OK) {
      throw new Error('Holders API returned unsuccessful response');
    }

    return res.data ?? [];
  } catch (error: any) {
    console.error('Error fetching holders:', error?.response?.data || error?.message);
    return [];
  }
}
