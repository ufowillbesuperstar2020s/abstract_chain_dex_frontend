'use client';

import { AbstractWalletProvider } from '@abstract-foundation/agw-react';
import { abstract /* or abstract */ } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AbstractWalletProvider chain={abstract}>
      {children}
    </AbstractWalletProvider>
  );
}
