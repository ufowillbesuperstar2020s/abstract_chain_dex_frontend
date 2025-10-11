'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Script from 'next/script';
import { ChartingLibraryWidgetOptions } from '@public/tv_charting_library/charting_library/charting_library';
import '@public/tv_charting_library/datafeed.js';
import TradingHeader from '@/components/trading/trading-header';
import TokenDataContainer from '@/components/trading/token-data-container/TokenDataContainer';
import TransactionTable from '@/components/trading/TransactionTable';
import ResizableSection from '@/components/layout/ResizableSection';
import BuySellCard from '@/components/trading/buy-sell-card';
import type { Interval } from '@/components/trading/token-data-container/IntervalDropdownUI';

const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
  symbol: 'NOOT',
  library_path: '/tv_charting_library/charting_library/',
  locale: 'en',
  theme: 'dark',
  charts_storage_url: 'https://saveload.tradingview.com',
  charts_storage_api_version: '1.1',
  client_id: 'tradingview.com',
  user_id: 'public_user_id',
  fullscreen: false,
  autosize: true
};

const TVChartContainer = dynamic(
  () => import('@/components/trading/tv-chart-container').then((m) => m.TVChartContainer),
  { ssr: false }
);

export default function Home() {
  const [tvReady, setTvReady] = useState(false);

  const pairAddress = '0x299270c5d97c23b2a5d4c8e045ef8682197b8fc0'; // wang_tmp_pair_address
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? 'http://160.202.131.23:8081';
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://160.202.131.23:8082';

  const [intervalUI, setIntervalUI] = useState<Interval>('1s');

  return (
    <div className="relative">
      {/* decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-40 right-0 -z-10 hidden w-[min(300px,20vw)] bg-gradient-to-l from-emerald-400/25 via-emerald-400/10 to-transparent blur-2xl xl:block"
      />

      {/* IMPORTANT: 2-row grid: header (auto) + content (fills) */}
      <div className="grid h-[calc(100vh-25px)] grid-cols-12 grid-rows-[auto,1fr] gap-4 md:gap-6">
        <Script
          src="/tv_charting_library/charting_library/charting_library.js"
          strategy="afterInteractive"
          onLoad={() => setTvReady(true)}
        />
        <Script src="/tv_charting_library/datafeeds/udf/dist/bundle.js" strategy="afterInteractive" />
        <Script src="/tv_charting_library/streaming.js" strategy="afterInteractive" />

        {/* row 1: header */}
        <div className="col-span-12 row-[1]">
          <TradingHeader />
        </div>

        {/* row 2: content */}
        <div className="col-span-12 row-[2] ml-12 flex min-h-0 flex-col xl:col-span-9">
          {/* token strip */}
          <div className="flex-none">
            <TokenDataContainer interval={intervalUI} onIntervalChange={(v) => setIntervalUI(v)} />
          </div>

          {/* chart (fixed/resizeable height) */}
          <div className="mt-3 flex-none border-t dark:border-gray-700">
            <ResizableSection storageKey="tvChartHeightPx" initialHeight={560} minHeight={80} className="mb-5">
              {tvReady && (
                <TVChartContainer
                  {...defaultWidgetProps}
                  pairAddress={pairAddress}
                  apiBase={apiBase}
                  wsUrl={wsUrl}
                  externalResolution={intervalUI}
                />
              )}
            </ResizableSection>
          </div>

          {/* 👇 fills the rest; the table will scroll inside itself */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <TransactionTable pairAddress={pairAddress} />
          </div>
        </div>

        {/* right sidebar shares the SAME row -> bottoms align */}
        <div className="col-span-12 row-[2] min-h-0 space-y-4 xl:col-span-3">
          <BuySellCard />
        </div>
      </div>
    </div>
  );
}
