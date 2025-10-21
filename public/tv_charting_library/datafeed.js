import { DEFAULT_PAIR_ADDRESS } from '@/utils/constants';

function CustomDatafeed(opts) {
  opts = opts || {};
  this.apiBase = (opts && opts.apiBase) || 'http://160.202.131.23:8081';
  this.wsUrl = (opts && opts.wsUrl) || 'ws://160.202.131.23:8083';
  this.pairAddress = (opts && opts.pairAddress) || DEFAULT_PAIR_ADDRESS;
  this.totalSupply = Number(opts && opts.totalSupply) || 0; // ✅ total supply injected from React
  this._subs = new Map();

  // react can update supply later
  if (typeof window !== 'undefined') {
    window.addEventListener('tv:updateTotalSupply', (e) => {
      this.totalSupply = Number(e && e.detail) || 0;
    });
  }
}

function mapResolutionForAPI(res) {
  switch (res) {
    case '1S':
      return '1s';
    case '1':
      return '1m';
    case '5':
      return '5m';
    case '15':
      return '15m';
    case '30':
      return '30m';
    case '60':
      return '1h';
    case '240':
      return '4h';
    case '720':
      return '12h';
    case '1D':
      return '1d';
    default:
      return '1d';
  }
}

function parseUnitAndMode(symbolInfo) {
  const name = symbolInfo?.name || symbolInfo?.ticker || '';
  const unit = (name.match(/@([A-Z]+)\b/) || [, 'USD'])[1];
  const mode = (name.match(/#(MCAP|PRICE)\b/) || [, 'PRICE'])[1];
  return { isUsd: unit === 'USD', isMcap: mode === 'MCAP', unit, mode };
}

function toMs(ts) {
  const n = Number(ts);
  return n > 1e12 ? n : n * 1000;
}
function asBars(json) {
  if (json && Array.isArray(json.bars)) return json.bars;
  if (Array.isArray(json)) return json;
  return [];
}

CustomDatafeed.prototype.onReady = function (cb) {
  setTimeout(() => cb({ supported_resolutions: ['1S', '1', '5', '15', '30', '60', '240', '720', '1D'] }), 0);
};

CustomDatafeed.prototype.resolveSymbol = function (symbolName, onResult) {
  const unit = (symbolName.match(/@([A-Z]+)\b/) || [, 'USD'])[1];
  const mode = (symbolName.match(/#(MCAP|PRICE)\b/) || [, 'PRICE'])[1];
  const pairLabel = symbolName.replace(/@([A-Z]+)\b/, '').replace(/#(MCAP|PRICE)\b/, '');

  // precision: WETH prices may be tiny; MCAP can vary widely.
  const isWeth = unit === 'WETH';
  const isMcap = mode === 'MCAP';
  const precision = isMcap ? 6 : isWeth ? 12 : 6;
  const priceScale = Math.pow(10, precision);

  setTimeout(
    () =>
      onResult({
        name: symbolName,
        ticker: symbolName,
        description: `${pairLabel} / ${unit} · ${mode}`,
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        minmov: 1,
        pricescale: priceScale,
        format: 'price',
        precision,
        has_intraday: true,
        has_seconds: true,
        supported_resolutions: ['1S', '1', '5', '15', '30', '60', '240', '720', '1D'],
        intraday_multipliers: ['1', '5', '15', '30', '60', '240', '720'],
        volume_precision: 8,
        currency_code: isMcap ? (unit === 'USD' ? 'USD' : unit) : unit
      }),
    0
  );
};

// HISTORICAL
CustomDatafeed.prototype.getBars = function (symbolInfo, resolution, periodParams, onHistory, onError) {
  const { from, to, countBack } = periodParams;
  const apiRes = mapResolutionForAPI(resolution);
  const { isUsd, isMcap } = parseUnitAndMode(symbolInfo);

  const url =
    `${this.apiBase}/api/ohlcv?pair_address=${this.pairAddress}` +
    `&resolution=${apiRes}&from=${from}&to=${to}&count_back=${countBack}` +
    `&is_usd=${isUsd ? 'true' : 'false'}`;

  fetch(url)
    .then((r) => r.json())
    .then((json) => {
      const rows = asBars(json);
      const mul = isMcap ? this.totalSupply || 0 : 1; // ✅ MCAP transform
      const tvBars = rows.map((b) => {
        const o = +(b.open ?? b.o ?? 0);
        const h = +(b.high ?? b.h ?? 0);
        const l = +(b.low ?? b.l ?? 0);
        const c = +(b.close ?? b.c ?? 0);
        return {
          time: toMs(b.timestamp),
          open: o * mul,
          high: h * mul,
          low: l * mul,
          close: c * mul,
          volume: +(b.volume ?? b.v ?? 0)
        };
      });
      onHistory(tvBars, { noData: tvBars.length === 0, nextTime: json?.nextTime });
    })
    .catch(onError);
};

// REALTIME (seed + subscribe)
CustomDatafeed.prototype.subscribeBars = function (symbolInfo, resolution, onRealtime, subscriberUID) {
  const self = this;
  const { isUsd, isMcap } = parseUnitAndMode(symbolInfo);

  const nowSec = Math.floor(Date.now() / 1000);
  const url =
    `${this.apiBase}/api/ohlcv?pair_address=${this.pairAddress}` +
    `&resolution=${mapResolutionForAPI(resolution)}&from=${nowSec - 3600}&to=${nowSec}&count_back=1` +
    `&is_usd=${isUsd ? 'true' : 'false'}`;

  fetch(url)
    .then((r) => r.json())
    .then((json) => {
      const rows = asBars(json);
      const last = rows.length ? rows[rows.length - 1] : null;
      const mul = isMcap ? self.totalSupply || 0 : 1;
      const lastBar = last
        ? {
            time: toMs(last.timestamp),
            open: +(last.open ?? last.o ?? 0) * mul,
            high: +(last.high ?? last.h ?? 0) * mul,
            low: +(last.low ?? last.l ?? 0) * mul,
            close: +(last.close ?? last.c ?? 0) * mul,
            volume: +(last.volume ?? last.v ?? 0)
          }
        : { time: Date.now(), open: 0, high: 0, low: 0, close: 0, volume: 0 };

      LooterStreaming.subscribeOnStream({
        wsUrl: self.wsUrl,
        resolution,
        pair_address: self.pairAddress,
        lastBar,
        onRealtime: (bar) => {
          // If stream raw prices, apply transform here too
          if (isMcap) {
            bar.open *= mul;
            bar.high *= mul;
            bar.low *= mul;
            bar.close *= mul;
          }
          onRealtime(bar);
        },
        makeSubscribeMsg: ({ resolution }) => ({
          type: 'SUBSCRIBE_PRICE',
          data: { resolution, pair_address: self.pairAddress, is_usd: isUsd }
        })
      });

      self._subs.set(subscriberUID, true);
    })
    .catch(() => {
      LooterStreaming.subscribeOnStream({
        wsUrl: self.wsUrl,
        resolution,
        pair_address: self.pairAddress,
        lastBar: { time: Date.now(), open: 0, high: 0, low: 0, close: 0, volume: 0 },
        onRealtime
      });
      self._subs.set(subscriberUID, true);
    });
};

CustomDatafeed.prototype.unsubscribeBars = function (subscriberUID) {
  if (!this._subs.has(subscriberUID)) return;
  LooterStreaming.unsubscribeFromStream({
    wsUrl: this.wsUrl,
    makeUnsubscribeMsg: () => ({ type: 'UNSUBSCRIBE_PRICE' })
  });
  this._subs.delete(subscriberUID);
};

window.CustomDatafeed = CustomDatafeed;
