'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { getTokenAddress } from '@/utils/getTokenAddress';
import { searchPairs } from '@/app/actions/searchPairs';

function getAddressFromRoute(pathname: string | null, params: Record<string, unknown> | null) {
  const p = params ?? {};
  if (typeof p.address === 'string' && p.address) return p.address;

  const path = pathname || '/';
  const parts = path.split('/');
  if (parts[1] === 'token' && parts[2]) return parts[2];

  return null;
}

export default function TokenInfoController() {
  const pathname = usePathname();
  const params = useParams();

  const pairAddress = getAddressFromRoute(pathname, params);

  const tokenAddress = useTokenInfoStore((s) => s.tokenAddress);
  const setTokenAddress = useTokenInfoStore((s) => s.setTokenAddress);
  const fetchTokenMetadata = useTokenInfoStore((s) => s.fetchTokenMetadata);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!pairAddress) return;

    async function resolveAndLoad(currentAddr: string) {
      try {
        const json = await searchPairs({
          q: currentAddr,
          chainId: 2741,
          resolution: '1d',
          index: 0,
          limit: 10
        });

        const pairs = json?.data?.pairs ?? json?.pairs ?? [];
        if (!pairs?.length) return;

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

    resolveAndLoad(pairAddress);
    return () => {
      cancelled = true;
    };
  }, [pairAddress, tokenAddress, setTokenAddress, fetchTokenMetadata]);

  return null; // no UI, just side-effect controller
}
