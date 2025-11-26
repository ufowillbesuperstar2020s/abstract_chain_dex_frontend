'use server';

import axios from 'axios';
import { StatusCodes } from 'http-status-codes';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://160.202.131.23:8081';

export async function fetchPositionsFromApi(wallet: string) {
  try {
    const url = `${API_BASE}/api/info/positions/${wallet}`;
    const res = await axios.get(url);

    if (res.status !== StatusCodes.OK || !Array.isArray(res.data)) {
      return {
        ok: false,
        status: res.status,
        data: []
      };
    }

    return {
      ok: true,
      status: res.status,
      data: res.data
    };
  } catch (e: any) {
    console.error('fetchPositionsFromApi error:', e?.message);
    return {
      ok: false,
      status: e?.response?.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
      data: []
    };
  }
}
