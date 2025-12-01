import { NextRequest, NextResponse } from 'next/server';
import { searchPairs } from '@/app/actions/searchPairs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const p = url.searchParams;

  const q = p.get('q') ?? '';
  const chainId = p.get('chain_id') ?? '2741';
  const resolution = p.get('resolution') ?? '1d';
  const index = p.get('index') ?? '0';
  const limit = p.get('limit') ?? '50';

  try {
    const data = await searchPairs({
      q,
      chainId,
      resolution,
      index,
      limit
    });

    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    let message = 'Internal server error';

    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
