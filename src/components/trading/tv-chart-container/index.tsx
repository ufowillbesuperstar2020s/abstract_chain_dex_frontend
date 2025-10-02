'use client';

import styles from './index.module.css';
import { useEffect, useRef } from 'react';
import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString
} from '@public/tv_charting_library/charting_library/charting_library';

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

export const TVChartContainer = (
  props: Partial<ChartingLibraryWidgetOptions> & {
    pairAddress?: string;
    apiBase?: string;
    wsUrl?: string;
    externalResolution?: string;
  }
) => {
  const chartContainerRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLInputElement>;

  useEffect(() => {
    const w = window as any;
    if (!w.TradingView || !w.TradingView.widget) {
      console.warn('TradingView library not loaded yet.');
      return; // wait until page sets isScriptReady
    }

    const tvResolution = toTV((props.externalResolution ?? props.interval) || '1d');

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: props.symbol,
      datafeed: new w.CustomDatafeed({
        apiBase: props.apiBase,
        wsUrl: props.wsUrl,
        pairAddress: props.pairAddress
      }),
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
      client_id: (props as any).client_id,
      user_id: (props as any).user_id,
      fullscreen: Boolean((props as any).fullscreen),
      autosize: Boolean((props as any).autosize),
      theme: (props as any).theme,
      custom_css_url: '/tv_charting_library/custom.css'
    };
    const tvWidget = new w.TradingView.widget(widgetOptions);

    // Units and Metrics
    tvWidget.onChartReady(() => {
      tvWidget.headerReady().then(() => {
        const makeToggle = (opts: {
          labels: [string, string];
          title: string;
          initialActive?: 0 | 1;
          onChange?: (activeIndex: 0 | 1) => void;
        }) => {
          const { labels, title, onChange, initialActive = 0 } = opts;

          const root = tvWidget.createButton() as HTMLElement;
          root.classList.add('tvseg');
          root.setAttribute('title', title);

          // Build two clickable pills with a slash between
          root.innerHTML = `
            <div class="tvseg-wrap">
              <button class="tvseg-btn is-active" data-index="0" type="button">${labels[0]}</button>
              <span class="tvseg-sep">/</span>
              <button class="tvseg-btn is-inactive" data-index="1" type="button">${labels[1]}</button>
            </div>
          `;

          const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('.tvseg-btn'));
          const setActive = (idx: 0 | 1) => {
            btns.forEach((b, i) => {
              b.classList.toggle('is-active', i === idx);
              b.classList.toggle('is-inactive', i !== idx);
            });
          };

          // default visual state
          setActive(initialActive);

          // click handling (UI only)
          btns.forEach((b) => {
            b.addEventListener('click', () => {
              const idx = (Number(b.dataset.index) as 0 | 1) || 0;
              setActive(idx);
              onChange && onChange(idx); // wang_no-op for now
            });
          });

          return { root, setActive };
        };

        // USD / WETH toggle (default to USD active)
        makeToggle({
          labels: ['USD', 'WETH'],
          title: 'Toggle USD/WETH',
          initialActive: 0,
          onChange: () => {
            // wang_later: setSymbol(...) or emit an event
          }
        });

        // MarketCap / Price toggle
        makeToggle({
          labels: ['MarketCap', 'Price'],
          title: 'Toggle MarketCap/Price',
          initialActive: 1,
          onChange: () => {
            // wang_later: setSymbol(...) or emit an event
          }
        });
      });
    });

    return () => tvWidget && tvWidget.remove();
  }, [
    props.symbol,
    props.interval,
    props.externalResolution,
    props.pairAddress,
    props.apiBase,
    props.wsUrl,
    props.library_path
  ]);

  return <div ref={chartContainerRef} className={styles.TVChartContainer} />;
};
