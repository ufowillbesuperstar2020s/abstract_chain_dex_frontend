import { NextRequest, NextResponse } from 'next/server';
import type { Transaction } from '@/types/trades';

const API_BASE = process.env.API_BASE ?? 'https://server23.looter.ai/evm-chart-api';

export async function GET(req: NextRequest) {
  const pair = req.nextUrl.searchParams.get('pair_address');
  const tx_type = req.nextUrl.searchParams.get('tx_type') ?? 'swap';
  const index = req.nextUrl.searchParams.get('index') ?? '0';
  const limit = req.nextUrl.searchParams.get('limit') ?? '100';

  if (!pair) {
    return NextResponse.json({ error: 'pair_address required' }, { status: 400 });
  }

  const url = `${API_BASE}/api/transactions?pair_address=${encodeURIComponent(
    pair
  )}&tx_type=${encodeURIComponent(tx_type)}&index=${encodeURIComponent(index)}&limit=${encodeURIComponent(limit)}`;

  const upstream = await fetch(url, { cache: 'no-store' });
  if (!upstream.ok) {
    return NextResponse.json({ error: `Upstream failed (${upstream.status})` }, { status: 502 });
  }

  const data = (await upstream.json()) as Transaction[];
  return NextResponse.json(data, { status: 200 });
}
