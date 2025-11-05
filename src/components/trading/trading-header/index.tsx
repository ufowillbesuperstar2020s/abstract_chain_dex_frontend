'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import SearchLauncher from '@/components/header/SearchLauncher';

import { useAccount, useBalance } from 'wagmi';
import { abstract } from '@/constants/chains/abstract';
import { formatUsd } from '@/utils/formatters';
import { ethToUsd } from '@/utils/ethToUsd';
import User from './User';

export default function TradingHeader() {
  const { address, status } = useAccount();

  const { data, isLoading, isError } = useBalance({
    address,
    chainId: abstract.id,
    query: {
      refetchInterval: 10_000,
      refetchOnWindowFocus: true
    }
  });

  const isSignedIn = status === 'connected' && !!address;
  const isConnecting = status === 'connecting' || status === 'reconnecting';

  const formattedCoin = data?.formatted ?? null;

  const [usdValue, setUsdValue] = useState<number | null>(null);

  useEffect(() => {
    if (!formattedCoin) return;

    (async () => {
      const val = await ethToUsd(Number(formattedCoin));
      setUsdValue(val);
    })();
  }, [formattedCoin]);

  const formattedUsd = usdValue ? formatUsd(usdValue, 2) : null;

  const formattedCoinFixed5 = parseFloat(Number(data?.formatted).toFixed(5));

  const socketRef = useRef<WebSocket | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          /* no-op */
        }
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="flex w-full items-center justify-between border-b border-[rgba(130,140,154,0.24)] p-2">
        {/* LEFT AREA */}
        <div className="ml-4 flex items-center gap-4">
          <div className="flex h-13 items-center gap-3 overflow-hidden dark:border-gray-800">
            <Image
              width={32}
              height={32}
              src="/images/logo/looter-green.svg"
              alt="user"
              className="h-9 w-9 object-cover"
              priority
            />

            <span className="inline-flex h-[16px] shrink-0 items-end gap-[1px]" role="img" aria-label="Looter">
              <Image src="/images/logo/letters/L.svg" alt="" width={16} height={16} className="h-4 w-auto" priority />
              <Image src="/images/logo/letters/o.svg" alt="" width={16} height={16} className="h-3.5 w-auto" />
              <Image src="/images/logo/letters/o-2.svg" alt="" width={16} height={16} className="h-3.5 w-auto" />
              <Image src="/images/logo/letters/t.svg" alt="" width={16} height={16} className="h-3.7 w-auto" />
              <Image src="/images/logo/letters/e.svg" alt="" width={16} height={16} className="h-3.5 w-auto" />
              <Image src="/images/logo/letters/r.svg" alt="" width={16} height={16} className="h-3.5 w-auto" />
            </span>
          </div>

          <nav className="ml-5 flex items-center gap-8">
            <h4 className="inline-flex shrink-0 items-center gap-2 text-base leading-tight text-gray-800 dark:text-white/90">
              <Image src="/images/icons/trending.svg" alt="Trending" width={20} height={20} className="h-5 w-5" />
              <span>Trending</span>
            </h4>

            <h4 className="inline-flex shrink-0 items-center gap-2 text-base text-gray-800 dark:text-white/90">
              <Image src="/images/icons/portfolio.png" alt="Portfolio" width={17} height={17} />
              <span>Portfolio</span>
            </h4>
          </nav>

          <SearchLauncher />
        </div>

        {/* RIGHT AREA */}
        <div className="mr-4 flex items-center gap-6 text-lg leading-none text-white/90">
          {/* balance pill */}
          <div
            aria-label="balance"
            className="balance cq min-w-0 items-center gap-2 overflow-hidden rounded-md bg-white/10 px-3 py-1 md:flex"
          >
            <Image
              src="/images/logo/ethereum_logo.svg"
              alt="ETH"
              width={6}
              height={6}
              className="eth-logo h-6 w-6 shrink-0"
              draggable={false}
            />

            <div className="overflow-hidden leading-tight">
              {/* coin balance */}
              <div
                className={[
                  'truncate font-semibold',
                  // shrink text when space is tight (falls back from text-base -> sm -> xs)
                  'text-sm max-[1180px]:text-sm max-[1040px]:text-xs',
                  !isSignedIn || isLoading || isError ? 'text-white/60' : ''
                ].join(' ')}
                title={
                  !isSignedIn
                    ? 'Wallet not connected'
                    : isError
                      ? 'Failed to load balance'
                      : formattedCoin
                        ? `${formattedCoin} ${data?.symbol ?? 'ETH'}`
                        : ''
                }
              >
                {!isSignedIn && '— —'}
                {isSignedIn && isLoading && 'Loading…'}
                {isSignedIn && !isLoading && (formattedCoinFixed5 ?? '0')}
                {isSignedIn && !isLoading && ` ${data?.symbol ?? 'ETH'}`}
              </div>

              {/* Secondary line: USD */}
              <div className="truncate text-xs text-white/60">
                {!isSignedIn && ''}
                {isSignedIn && isLoading && ''}
                {isSignedIn && !isLoading && (formattedUsd ?? '—')}
              </div>
            </div>
          </div>

          <User />

          <button
            type="button"
            aria-label="Referrals"
            className="flex h-9 items-center gap-2 rounded-md bg-white px-5 py-4 whitespace-nowrap text-black hover:bg-white/90"
            disabled={isConnecting}
          >
            <span className="text-base leading-none font-medium">Referrals</span>
          </button>
        </div>
      </div>
    </div>
  );
}
