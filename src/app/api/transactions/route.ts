import { NextRequest, NextResponse } from 'next/server';
import type { Transaction } from '@/types/trades';

const API_BASE = process.env.API_BASE ?? 'https://server23.looter.ai/evm-chart-api/';

export async function GET(req: NextRequest) {
  const pair = req.nextUrl.searchParams.get('pair_address');
  const tx_type = req.nextUrl.searchParams.get('tx_type');
  const limit = req.nextUrl.searchParams.get('limit');
  if (!pair) {
    return NextResponse.json({ error: 'pair_address required' }, { status: 400 });
  }

  const upstream = await fetch(
    `${API_BASE}/api/transactions?pair_address=${encodeURIComponent(pair)}&tx_type=${tx_type}&limit=${limit}`,
    {
      cache: 'no-store'
    }
  );

  if (!upstream.ok) {
    return NextResponse.json({ error: `Upstream failed (${upstream.status})` }, { status: 502 });
  }

  const data = (await upstream.json()) as Transaction[];
  return NextResponse.json(data, { status: 200 });
}
