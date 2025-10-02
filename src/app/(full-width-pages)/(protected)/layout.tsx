'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import TokenInfoController from '@/app/controllers/TokenInfoController';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { status, isConnected } = useAccount();
  const router = useRouter();

  // wait for client + wagmi to settle
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ready = mounted && status !== 'connecting' && status !== 'reconnecting';

  useEffect(() => {
    if (!ready) return;
    if (!isConnected) router.replace('/authentication');
  }, [ready, isConnected, router]);

  // Block rendering of protected pages until allowed → no child effects can race
  if (!ready || !isConnected) return null;

  return (
    <>
      <TokenInfoController />
      {children}
    </>
  );
}
