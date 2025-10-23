'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { DEFAULT_PAIR_ADDRESS } from '@/utils/constants';
import { getTokenAddress } from '@/utils/getTokenAddress';

const FALLBACK = DEFAULT_PAIR_ADDRESS;

function getAddressFromRoute(pathname: string | null, params: Record<string, unknown> | null) {
  const p = params ?? {};
  if (typeof p.address === 'string' && p.address) return p.address;

  const path = pathname || '/';
  const parts = path.split('/');
  if (parts[1] === 'token' && parts[2]) return parts[2];

  return FALLBACK;
}

export default function TokenInfoController() {
  const pathname = usePathname();
  const params = useParams();

  const pairAddress = getAddressFromRoute(pathname, params);

  const tokenAddress = useTokenInfoStore((s) => s.tokenAddress);
  const setTokenAddress = useTokenInfoStore((s) => s.setTokenAddress);
  const fetchTokenMetadata = useTokenInfoStore((s) => s.fetchTokenMetadata);
  const setError = useState<string | null>(null)[1];

  useEffect(() => {
    let cancelled = false;

    async function resolveAndLoad() {
      const url = `/api/search?q=${encodeURIComponent(pairAddress)}&chain_id=2741&resolution=1d&index=0&limit=10`;
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error(`search upstream error ${r.status}`);
        const json = await r.json();
        const pairs = json?.data?.pairs ?? json?.pairs ?? [];
        if (!pairs?.length) {
          // nothing came back — optionally keep last tokenAddress
          return;
        }

        const p = pairs[0];
        const nextAddr = getTokenAddress({
          token0_address: p.token0_address,
          token1_address: p.token1_address,
          chain_id: p.chain_id
        });

        if (!nextAddr) return;

        if (!cancelled && nextAddr !== tokenAddress) {
          setTokenAddress(nextAddr);
          fetchTokenMetadata(nextAddr);
        } else if (!useTokenInfoStore.getState().tokenMetadata) {
          fetchTokenMetadata(nextAddr);
        }
      } catch (error) {
        setError((error as Error)?.message ?? 'Failed to load');
      }
    }

    resolveAndLoad();
    return () => {
      cancelled = true;
    };
  }, [pathname, params, tokenAddress, setTokenAddress, fetchTokenMetadata]);

  return null; // no UI, just side-effect controller
}
