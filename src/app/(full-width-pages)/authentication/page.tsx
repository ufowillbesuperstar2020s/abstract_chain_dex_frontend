'use client';

import Image from 'next/image';
import { useLoginWithAbstract } from '@abstract-foundation/agw-react';
import { useAccount } from 'wagmi';

export default function AuthenticationPage() {
  const { login } = useLoginWithAbstract();
  const { isConnecting, isConnected } = useAccount();

  return (
    <main className="${inter.className} relative min-h-dvh overflow-hidden bg-[#0e1116] text-white">
      <div
        aria-hidden
        className={[
          'pointer-events-none absolute inset-y-40 left-0 z-10',
          'left-[-14vw]',
          // width of the glow area; tweak as you like:
          'w-[50vw] max-w-[720px] min-w-[360px]',
          // soft green gradient that fades leftward
          'bg-gradient-to-r from-emerald-400/25 via-emerald-400/10 to-transparent',
          // feather it out
          'blur-2xl',
          // show on xl and up (so mobile/tablet stays clean)
          'hidden xl:block'
        ].join(' ')}
      />

      <div className="mx-auto grid min-h-dvh w-full gap-8 px-4 py-8 md:grid-cols-2">
        {/* LEFT: Login card */}
        <section className="my-60 ml-40 w-130">
          <h2 className="text-3xl">Login to Terminal</h2>
          <button
            type="button"
            onClick={login}
            className="mt-10 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-black hover:bg-emerald-400 active:translate-y-[1px]"
            disabled={isConnecting}
          >
            {isConnected ? 'Connected' : isConnecting ? 'Connecting…' : 'Connect AGW'}
          </button>
        </section>

        {/* RIGHT: Welcome / brand panel */}
        <aside className="relative hidden h-full overflow-hidden rounded-2xl md:block">
          {/* Soft glossy background */}
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(120%_100%_at_100%_50%,rgba(43,255,195,0.8),transparent_80%)]" />
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(300%_300%_at_90%_60%,rgba(0,0,0,1),transparent_20%)]" />
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(300%_300%_at_90%_60%,rgba(0,0,0,1),transparent_20%)]" />

          {/* Card surface */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/30">
            <div>
              <Image
                src="/images/logo/large_looter_logo.svg"
                alt="Looter"
                width={32}
                height={32}
                className="h-64 w-64"
              />
            </div>

            <div className="mt-15 text-center">
              <p className="text-5xl font-semibold">Welcome</p>
              <p className="mt-4 font-mono text-lg text-white/80">
                to Looter’s Abstract
                <br />
                Trading Terminal
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
