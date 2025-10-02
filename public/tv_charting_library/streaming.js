// UMD-ish: attach to window so datafeed.js can use it
(function () {
  // --- helpers ---------------------------------------------------------------
  function parseResolution(res) {
    // TradingView resolutions like '1S', '1', '5', '15', '60', '1D'
    if (typeof res !== 'string') return { unit: 'm', value: 1 };
    const m = /^(\d+)(S|D)?$/i.exec(res.trim());
    if (!m) return { unit: 'm', value: 1 };
    const n = Number(m[1]);
    const unit = (m[2] || 'm').toUpperCase(); // default minutes
    return { unit, value: n };
  }

  function resToMs(resolution) {
    const { unit, value } = parseResolution(resolution);
    if (unit === 'S') return value * 1000;
    if (unit === 'D') return value * 24 * 60 * 60 * 1000;
    // minutes
    return value * 60 * 1000;
  }

  function getNextBarTime(lastBar, resolution) {
    const step = resToMs(resolution);
    const last = typeof lastBar.time === 'number' ? lastBar.time : 0;
    return last + step;
  }

  // --- socket singleton ------------------------------------------------------
  const sockets = {}; // keyed by wsUrl so environments can vary

  function getSocket(wsUrl) {
    if (sockets[wsUrl]) return sockets[wsUrl];

    const socket = new WebSocket(wsUrl);
    socket.addEventListener('open', () => console.log('[ws] connected:', wsUrl));
    socket.addEventListener('close', () => console.log('[ws] closed:', wsUrl));
    socket.addEventListener('error', (e) => console.log('[ws] error:', e));

    sockets[wsUrl] = socket;
    return socket;
  }

  // --- subscription state ----------------------------------------------------
  // symbols/resolutions simultaneously, switch this to a Map keyed by uid.
  let subscriptionItem = null;

  function subscribeOnStream({ wsUrl, resolution, address, onRealtime, lastBar, makeSubscribeMsg }) {
    const socket = getSocket(wsUrl);

    subscriptionItem = {
      address,
      resolution,
      lastBar,
      nextBarTime: getNextBarTime(lastBar, resolution),
      callback: onRealtime
    };

    // For your vanish server this looked like:
    // { type: 'SUBSCRIBE_PRICE', data: { resolution, address, currency: 'usd' } }
    if (typeof makeSubscribeMsg === 'function') {
      const msg = makeSubscribeMsg({ resolution, address });
      const send = () => socket.send(JSON.stringify(msg));
      socket.readyState === WebSocket.OPEN ? send() : socket.addEventListener('open', send, { once: true });
    }

    // Handle incoming ticks
    function onMessage(ev) {
      try {
        const msgData = JSON.parse(ev.data);

        // Adjust this mapping if your payload differs.
        if (!msgData || msgData.data.timestamp == null) {
          return;
        }
        const unixTimeMs = Number(msgData.data.timestamp) * 1000;
        const lastBar = subscriptionItem.lastBar;
        let bar;

        if (unixTimeMs < subscriptionItem.nextBarTime) {
          // still in the current bucket — update high/low/close/volume
          bar = {
            ...lastBar,
            high: Math.max(lastBar.high, Number(msgData.data.high)),
            low: Math.min(lastBar.low, Number(msgData.data.low)),
            close: Number(msgData.data.close),
            volume: Number(msgData.data.volume)
          };
          subscriptionItem.lastBar = bar;
        } else {
          // we’ve crossed into the next bucket — create a new bar
          bar = {
            time: unixTimeMs,
            open: Number(msgData.data.open),
            high: Number(msgData.data.high),
            low: Number(msgData.data.low),
            close: Number(msgData.data.close),
            volume: Number(msgData.data.volume)
          };

          // continuity: if the tick lands exactly at bucket boundary, open = prev close
          if (unixTimeMs === subscriptionItem.nextBarTime) {
            bar.open = lastBar.close;
          }

          subscriptionItem.lastBar = bar;
          subscriptionItem.nextBarTime = getNextBarTime(bar, subscriptionItem.resolution);
        }

        subscriptionItem.callback(bar);
      } catch (e) {
        // ignore parse errors
      }
    }

    // keep a handle so we can detach on unsubscribe
    socket.addEventListener('message', onMessage);
    subscriptionItem._onMessage = onMessage;
  }

  function unsubscribeFromStream({ wsUrl, makeUnsubscribeMsg }) {
    const socket = sockets[wsUrl];
    if (!socket || !subscriptionItem) return;

    // Detach listener
    if (subscriptionItem._onMessage) {
      socket.removeEventListener('message', subscriptionItem._onMessage);
    }

    if (typeof makeUnsubscribeMsg === 'function') {
      try {
        socket.send(JSON.stringify(makeUnsubscribeMsg()));
      } catch (_) {}
    }

    subscriptionItem = null;
  }

  // expose
  window.LooterStreaming = {
    subscribeOnStream,
    unsubscribeFromStream,
    _helpers: { parseResolution, resToMs, getNextBarTime }
  };
})();
