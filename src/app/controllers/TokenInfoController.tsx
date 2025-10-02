'use client';

import { useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { DEFAULT_TOKEN_ADDRESS } from '@/utils/constants';

const FALLBACK = DEFAULT_TOKEN_ADDRESS;

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

  const tokenAddress = useTokenInfoStore((s) => s.tokenAddress);
  const setTokenAddress = useTokenInfoStore((s) => s.setTokenAddress);
  const fetchTokenMetadata = useTokenInfoStore((s) => s.fetchTokenMetadata);

  useEffect(() => {
    const nextAddr = getAddressFromRoute(pathname, params);
    if (nextAddr !== tokenAddress) {
      setTokenAddress(nextAddr);
      fetchTokenMetadata(nextAddr);
    } else if (!useTokenInfoStore.getState().tokenMetadata) {
      fetchTokenMetadata(nextAddr);
    }
  }, [pathname, params, tokenAddress, setTokenAddress, fetchTokenMetadata]);

  return null; // no UI, just side-effect controller
}
