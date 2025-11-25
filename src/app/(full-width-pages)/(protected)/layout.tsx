'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import TradingHeader from '@/components/trading/trading-header';
import TokenInfoController from '@/app/controllers/TokenInfoController';

/** Inner component that uses navigation hooks; wrapped in Suspense by the Layout */
function ProtectedLayoutInner({ children }: { children: React.ReactNode }) {
  const { status, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // wait for client + wagmi to settle
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ready = mounted && status !== 'connecting' && status !== 'reconnecting';

  const currentPathWithQuery = useMemo(() => {
    const qs = searchParams?.toString();
    return qs && qs.length > 0 ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!ready) return;
    if (!isConnected) {
      const nextParam = encodeURIComponent(currentPathWithQuery);
      router.replace(`/authentication?next=${nextParam}`);
    }
  }, [ready, isConnected, router, currentPathWithQuery]);

  // Block rendering of protected pages until allowed → no child effects can race
  if (!ready || !isConnected) return null;

  return (
    <>
      <TokenInfoController />

      <div className="sticky top-0 z-40 bg-transparent">
        <TradingHeader />
      </div>

      {children}
    </>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
    </Suspense>
  );
}
