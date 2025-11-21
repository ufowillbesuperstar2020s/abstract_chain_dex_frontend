'use server';

const UPSTREAM = 'http://160.202.131.23:8081/api/info/pair/list';

export interface SearchPairParams {
  q?: string;
  chainId?: string | number;
  resolution?: string;
  index?: string | number;
  limit?: string | number;
}

export async function searchPairs(params: SearchPairParams) {
  const url =
    `${UPSTREAM}?chain_id=${params.chainId ?? '2741'}` +
    `&resolution=${encodeURIComponent(params.resolution ?? '1d')}` +
    `&index=${params.index ?? '0'}` +
    `&limit=${params.limit ?? '50'}` +
    `&query=${encodeURIComponent(params.q ?? '')}`;

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) throw new Error(`Upstream error ${res.status}`);

  return res.json();
}
