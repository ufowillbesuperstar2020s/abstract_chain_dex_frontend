'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { DEFAULT_PAIR_LIST } from '@/utils/constants';

function sanitizeNext(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const decoded = decodeURIComponent(input);
    if (!decoded.startsWith('/')) return null;
    if (decoded.startsWith('//')) return null;
    if (/^https?:/i.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Inner component that uses navigation hooks; wrapped in Suspense by the Layout */
function FullWidthPageLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status, isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ready = mounted && status !== 'connecting' && status !== 'reconnecting';

  const targetAfterAuth = useMemo(() => {
    const rawNext = searchParams?.get('next') || undefined;
    return sanitizeNext(rawNext) || DEFAULT_PAIR_LIST;
  }, [searchParams]);

  useEffect(() => {
    if (!ready) return;
    if (isConnected && pathname === '/authentication') {
      router.replace(targetAfterAuth);
    }
  }, [ready, isConnected, pathname, router, targetAfterAuth]);

  return <>{children}</>;
}

export default function FullWidthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <FullWidthPageLayoutInner>{children}</FullWidthPageLayoutInner>
    </Suspense>
  );
}
