import { DEFAULT_PAIR_ADDRESS } from '@/utils/constants';

function CustomDatafeed(opts) {
  opts = opts || {};
  this.apiBase = (opts && opts.apiBase) || 'http://160.202.131.23:8081';
  this.wsUrl = (opts && opts.wsUrl) || 'ws://160.202.131.23:8083';
  this.pairAddress = (opts && opts.pairAddress) || DEFAULT_PAIR_ADDRESS;
  this._subs = new Map();
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

CustomDatafeed.prototype.onReady = function (cb) {
  setTimeout(() => cb({ supported_resolutions: ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '12h', '1d'] }), 0);
};

CustomDatafeed.prototype.resolveSymbol = function (symbolName, onResult) {
  setTimeout(
    () =>
      onResult({
        name: symbolName,
        ticker: symbolName,
        description: symbolName + '/WETH on Abstract Swap · looter.ai',
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        minmov: 1,
        pricescale: 1_000_000,
        has_intraday: true,
        has_seconds: true,
        supported_resolutions: ['1S', '1', '5', '15', '30', '60', '240', '720', '1D'],
        intraday_multipliers: ['1', '5', '15', '30', '60', '240', '720']
      }),
    0
  );
};

// --- HISTORICAL BARS -------------------------------
CustomDatafeed.prototype.getBars = function (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
  const { from, to, countBack } = periodParams;
  const apiRes = mapResolutionForAPI(resolution);

  const url =
    `${this.apiBase}/api/ohlcv?pair_address=${this.pairAddress}` +
    `&resolution=${apiRes}&from=${from}&to=${to}&count_back=${countBack}`;

  fetch(url)
    .then((r) => r.json())
    .then(({ bars, nextTime }) => {
      const tvBars = (bars || []).map((b) => ({
        time: b.timestamp,
        open: +b.open,
        high: +b.high,
        low: +b.low,
        close: +b.close,
        volume: +b.volume
      }));
      onHistoryCallback(tvBars, { noData: tvBars.length === 0, nextTime });
    })
    .catch((err) => onErrorCallback(err));
};

// --- REALTIME (WebSocket) ---------------------------------------------------
CustomDatafeed.prototype.subscribeBars = function (
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID /*, onResetCacheNeededCallback */
) {
  // Use the last historical bar as a starting point (TradingView passes it in some setups;
  // if not available here, we’ll request the most recent one)
  const self = this;

  // Fetch the latest bar to seed the aggregator (count_back=1)
  const nowSec = Math.floor(Date.now() / 1000);
  const url =
    `${this.apiBase}/api/ohlcv?pair_address=${this.pairAddress}` +
    `&resolution=${mapResolutionForAPI(resolution)}&from=${nowSec - 3600}&to=${nowSec}&count_back=1`;

  fetch(url)
    .then((r) => r.json())
    .then((json) => {
      const last = Array.isArray(json) && json.length ? json[json.length - 1] : null;

      const lastBar = last
        ? {
            time: Number(last.timestamp) * 1000,
            open: Number(last.o),
            high: Number(last.h),
            low: Number(last.l),
            close: Number(last.c),
            volume: Number(last.v)
          }
        : {
            time: Date.now(),
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            volume: 0
          };

      // Start WS streaming
      LooterStreaming.subscribeOnStream({
        wsUrl: self.wsUrl,
        resolution,
        pair_address: self.pairAddress,
        lastBar,
        onRealtime: onRealtimeCallback,

        makeSubscribeMsg: ({ resolution }) => ({
          type: 'SUBSCRIBE_PRICE',
          data: {
            resolution,
            pair_address: self.pairAddress,
            is_usd: true
          }
        })
      });

      self._subs.set(subscriberUID, true);
    })
    .catch(() => {
      LooterStreaming.subscribeOnStream({
        wsUrl: self.wsUrl,
        resolution,
        address: self.pairAddress,
        lastBar: { time: Date.now(), open: 0, high: 0, low: 0, close: 0, volume: 0 },
        onRealtime: onRealtimeCallback
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

// expose
window.CustomDatafeed = CustomDatafeed;
