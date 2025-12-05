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

    console.log('wang_url', url);

    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('wang_res');

    return {
      ok: true,
      data: res.data
    };
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

    return {
      ok: false,
      error: message
    };
  }
}
