'use server';

import axios from 'axios';
import { StatusCodes } from 'http-status-codes';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://server23.looter.ai/evm-chart-api/';

export interface PairListParams {
  chain_id: number;
  resolution: string;
  index: number;
  limit: number;
  order_by: string;
  filters?: Record<string, string | number | boolean | undefined>;
}

export async function fetchPairListFromApi(params: PairListParams) {
  try {
    const query = new URLSearchParams({
      chain_id: String(params.chain_id),
      resolution: params.resolution,
      index: String(params.index),
      limit: String(params.limit),
      order_by: params.order_by
    });

    if (params.filters) {
      for (const key of Object.keys(params.filters)) {
        const value = params.filters[key];
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      }
    }

    const url = `${API_BASE}/api/info/pair/list?${query}`;

    const res = await axios.get(url);

    if (res.status !== StatusCodes.OK) {
      throw new Error(`Pair list API returned HTTP ${res.status}`);
    }

    return res.data;
  } catch (error: any) {
    console.error('Error fetching pair list:', error.response?.data || error.message);
    return null;
  }
}
