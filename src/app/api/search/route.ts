import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = 'http://160.202.131.23:8081/api/info/pair/list';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const chainId = searchParams.get('chain_id') ?? '2741'; // 2741 is Abstract chain id
  const resolution = searchParams.get('resolution') ?? '1h';
  const index = searchParams.get('index') ?? '0';
  const limit = searchParams.get('limit') ?? '50';

  const upstreamUrl = `${UPSTREAM}?chain_id=${encodeURIComponent(
    chainId
  )}&resolution=${encodeURIComponent(resolution)}&index=${encodeURIComponent(
    index
  )}&limit=${encodeURIComponent(limit)}&query=${encodeURIComponent(q)}`;

  try {
    const r = await fetch(upstreamUrl, { cache: 'no-store' });
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: `Upstream error ${r.status}` }, { status: r.status });
    }
    const data = await r.json();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
