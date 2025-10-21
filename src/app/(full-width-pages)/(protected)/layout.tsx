'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import TokenInfoController from '@/app/controllers/TokenInfoController';
import TradingHeader from '@/components/trading/trading-header';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
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
  }, [ready, isConnected, router]);

  // Block rendering of protected pages until allowed → no child effects can race
  if (!ready || !isConnected) return null;

  return (
    <>
      <TokenInfoController />
      
      <div className="sticky top-0 z-40 bg-[#1a1a1a]">
        <TradingHeader />
      </div>

      {children}
    </>
  );
}
