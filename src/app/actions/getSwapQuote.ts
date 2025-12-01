'use server';

import axios from 'axios';

const SWAP_API = process.env.NEXT_PUBLIC_API_SWAP ?? 'https://server23.looter.ai/abs-swap-api';

export interface SwapQuotePayload {
  wallet_address: string;
  token_address: string;
  amount_in: string;
  is_sell: boolean;
  slippage: number;
}

export async function getSwapQuote(payload: SwapQuotePayload) {
  try {
    const url = `${SWAP_API}/quote`;

    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return {
      ok: true,
      data: res.data
    };
  } catch (e: unknown) {
    let status = StatusCodes.INTERNAL_SERVER_ERROR;

    if (axios.isAxiosError(e)) {
      status = e.response?.status ?? StatusCodes.INTERNAL_SERVER_ERROR;
      console.error('fetchPositionsFromApi error:', e.message);
    } else if (e instanceof Error) {
      console.error('fetchPositionsFromApi error:', e.message);
    } else {
      console.error('fetchPositionsFromApi unknown error:', e);
    }

    return {
      ok: false,
      status,
      data: []
    };
  }
}
