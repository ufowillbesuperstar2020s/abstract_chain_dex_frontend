'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { DEFAULT_TOKEN_ROUTE } from '@/utils/constants';

export default function FullWidthPageLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ready = mounted && status !== 'connecting' && status !== 'reconnecting';

  useEffect(() => {
    if (!ready) return;
    if (isConnected && pathname === '/authentication') {
      router.replace(DEFAULT_TOKEN_ROUTE);
    }
  }, [ready, isConnected, pathname, router]);

  return <>{children}</>;
}
