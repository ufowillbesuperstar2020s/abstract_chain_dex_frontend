'use client';

import styles from './index.module.css';
import { useEffect, useRef, useMemo } from 'react';
import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  IBasicDataFeed,
  IDatafeedChartApi,
  IExternalDatafeed,
  IDatafeedQuotesApi
} from '@public/tv_charting_library/charting_library/charting_library';
import { useTokenMetricsStore } from '@/app/stores/tokenMetrics-store';

function toTV(res: string): string {
  const m: Record<string, string> = {
    '1s': '1S',
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '12h': '720',
    '1d': '1D'
  };
  return m[res] ?? '1D';
}

type TVWidget = {
  onChartReady(cb: () => void): void;
  headerReady(): Promise<void>;
  createButton(): HTMLElement;
  remove(): void;
  activeChart(): {
    symbol(): string;
    resolution(): ResolutionString;
    setSymbol(symbol: string, interval: ResolutionString, cb?: () => void): void;
  };
};

type TVDatafeed = IBasicDataFeed | (IDatafeedChartApi & IExternalDatafeed & IDatafeedQuotesApi);
type WindowWithTV = Window & {
  TradingView?: { widget: new (opts: ChartingLibraryWidgetOptions) => TVWidget };
  CustomDatafeed?: new (opts: {
    apiBase?: string;
    wsUrl?: string;
    pairAddress?: string;
    totalSupply?: number;
  }) => TVDatafeed;
};

export const TVChartContainer = (
  props: Partial<ChartingLibraryWidgetOptions> & {
    pairAddress?: string;
    apiBase?: string;
    wsUrl?: string;
    externalResolution?: string;
  }
) => {
  const chartContainerRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLInputElement>;

  // read total supply from store
  const { metrics } = useTokenMetricsStore();

  // tokens (already divided by 10**decimals in the store)
  const totalSupply = useMemo(() => Number(metrics?.supplyHuman ?? 0), [metrics?.supplyHuman]);

  useEffect(() => {
    const w = window as unknown as WindowWithTV;
    if (!w.TradingView?.widget || !w.CustomDatafeed) return;

    const tvResolution = toTV((props.externalResolution ?? props.interval) || '1d');

    const datafeed: TVDatafeed = new w.CustomDatafeed({
      apiBase: props.apiBase,
      wsUrl: props.wsUrl,
      pairAddress: props.pairAddress,
      totalSupply // ✅ pass once
    });

    // keep datafeed in sync if supply changes later
    window.dispatchEvent(new CustomEvent('tv:updateTotalSupply', { detail: totalSupply }));

    const base = (props.symbol as string) || (props.pairAddress as string) || 'UNKNOWN';
    let unit: 'USD' | 'WETH' = 'USD';
    let mode: 'PRICE' | 'MCAP' = 'PRICE';

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: `${base}@${unit}#${mode}`, // ✅ full key
      datafeed,
      interval: tvResolution as ResolutionString,
      container: chartContainerRef.current,
      library_path: props.library_path,
      locale: props.locale as LanguageCode,
      disabled_features: [
        'use_localstorage_for_settings',
        'auto_enable_symbol_labels',
        'header_symbol_search',
        'symbol_search_hot_key',
        'left_toolbar',
        'header_resolutions',
        'header_chart_type',
        'header_undo_redo',
        'header_compare'
      ],
      enabled_features: ['study_templates', 'seconds_resolution'],
      charts_storage_url: props.charts_storage_url,
      charts_storage_api_version: props.charts_storage_api_version,
      client_id: props.client_id,
      user_id: props.user_id,
      fullscreen: Boolean(props.fullscreen),
      autosize: Boolean(props.autosize),
      theme: props.theme,
      custom_css_url: '/tv_charting_library/custom.css'
    };
    const tv = new w.TradingView.widget(widgetOptions);

    tv.onChartReady(() => {
      tv.headerReady().then(() => {
        const makeToggle = (opts: {
          labels: [string, string];
          title: string;
          initialActive?: 0 | 1;
          onChange?: (activeIndex: 0 | 1) => void;
        }) => {
          const { labels, title, onChange, initialActive = 0 } = opts;
          const root = tv.createButton() as HTMLElement;
          root.classList.add('tvseg');
          root.setAttribute('title', title);
          root.innerHTML = `
            <div class="tvseg-wrap">
              <button class="tvseg-btn ${initialActive === 0 ? 'is-active' : 'is-inactive'}" data-index="0" type="button">${labels[0]}</button>
              <span class="tvseg-sep">/</span>
              <button class="tvseg-btn ${initialActive === 1 ? 'is-active' : 'is-inactive'}" data-index="1" type="button">${labels[1]}</button>
            </div>`;
          const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('.tvseg-btn'));
          const setActive = (idx: 0 | 1) =>
            btns.forEach((b, i) => {
              b.classList.toggle('is-active', i === idx);
              b.classList.toggle('is-inactive', i !== idx);
            });
          btns.forEach((b) =>
            b.addEventListener('click', () => {
              const idx = (Number(b.dataset.index) as 0 | 1) || 0;
              setActive(idx);
              onChange?.(idx);
            })
          );
          return { root, setActive };
        };

        // USD / WETH
        makeToggle({
          labels: ['USD', 'WETH'],
          title: 'Toggle USD/WETH',
          initialActive: 0,
          onChange: (i) => {
            unit = i === 0 ? 'USD' : 'WETH';
            const chart = tv.activeChart();
            const interval = chart.resolution();
            chart.setSymbol(`${base}@${unit}#${mode}`, interval as ResolutionString);
          }
        });

        // MarketCap / Price
        makeToggle({
          labels: ['MarketCap', 'Price'],
          title: 'Toggle MarketCap/Price',
          initialActive: 1, // default Price
          onChange: (i) => {
            mode = i === 0 ? 'MCAP' : 'PRICE';
            const chart = tv.activeChart();
            const interval = chart.resolution();
            chart.setSymbol(`${base}@${unit}#${mode}`, interval as ResolutionString);
          }
        });
      });
    });

    return () => tv.remove();
  }, [
    props.symbol,
    props.interval,
    props.externalResolution,
    props.pairAddress,
    props.apiBase,
    props.wsUrl,
    props.library_path,
    totalSupply // ✅ re-run to push new supply and event
  ]);

  return <div ref={chartContainerRef} className={styles.TVChartContainer} />;
};
