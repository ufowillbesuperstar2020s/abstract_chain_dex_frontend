'use server';

import { format } from 'date-fns';

function formatTimestamp(ts: number) {
  const date = new Date(ts * 1000);
  return format(date, 'MM-dd-yyyy | HH:mm:ss');
}

export async function getHolders(tokenAddress: string) {
  try {
    const res = await fetch(`http://160.202.131.23:8081/api/info/holders/${tokenAddress}`, { cache: 'no-store' });

    if (!res.ok) return [];

    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Holders API error:', e);
    return [];
  }
}
