'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { DEFAULT_TOKEN_ROUTE } from '@/utils/constants';

function sanitizeNext(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    // decode once in case we received an encoded value
    const decoded = decodeURIComponent(input);

    // Only allow internal paths like "/token/..." (no scheme, no domain, no protocol-relative)
    if (!decoded.startsWith('/')) return null;
    if (decoded.startsWith('//')) return null;
    // Basic hardening: block attempts to smuggle protocols
    if (/^https?:/i.test(decoded)) return null;

    return decoded;
  } catch {
    return null;
  }
}

export default function FullWidthPageLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status, isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ready = mounted && status !== 'connecting' && status !== 'reconnecting';

  const targetAfterAuth = useMemo(() => {
    const rawNext = searchParams?.get('next') || undefined;
    return sanitizeNext(rawNext) || DEFAULT_TOKEN_ROUTE;
  }, [searchParams]);

  useEffect(() => {
    if (!ready) return;
    if (isConnected && pathname === '/authentication') {
      router.replace(targetAfterAuth);
    }
  }, [ready, isConnected, pathname, router]);

  return <>{children}</>;
}
