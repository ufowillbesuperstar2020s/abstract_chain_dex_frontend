function toPlainDecimalString(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const s = String(n);
  if (!/[eE]/.test(s)) {
    if (s.startsWith('.')) return '0' + s;
    if (s === '-0') return '0';
    return s;
  }
  const m = s.match(/^([+-]?)(\d*\.?\d+)[eE]([+-]?\d+)$/);
  if (!m) return s;

  const [, sign, mantissa, expStr] = m;
  const exp = parseInt(expStr, 10);
  const [ip = '0', fp = ''] = mantissa.split('.');
  const digits = (ip + fp).replace(/^0+/, '') || '0';
  const dotPos = ip.length;
  const newDot = dotPos + exp;

  if (newDot <= 0) {
    const zeros = '0'.repeat(-newDot);
    return `${sign === '-' ? '-' : ''}0.${zeros}${digits}`;
  }
  if (newDot >= digits.length) {
    const zeros = '0'.repeat(newDot - digits.length);
    return `${sign === '-' ? '-' : ''}${digits}${zeros}`;
  }
  return `${sign === '-' ? '-' : ''}${digits.slice(0, newDot)}.${digits.slice(newDot)}`;
}

/**
 * Formats a USD value.
 * - 0 < |n| < 0.0001 -> "$0.0 ₙ dddd" (we render n via JSX, larger and dropped)
 * - |n| < 1          -> "$x.xxxx"
 * - >= 1             -> K/M/B/T rules
 */
export function fmtUSD(n: number): React.ReactNode {
  if (!Number.isFinite(n)) return '$0';
  const abs = Math.abs(n);

  // === CLEAN ZERO RULE ===
  // If value is essentially zero, return "$0"
  if (abs === 0 || abs < 1e-12) return '$0';

  // Tiny numbers: "$0.0 (subscript zeros) digits"
  if (abs < 0.0001) {
    const dec = toPlainDecimalString(abs);
    const after = dec.startsWith('0.') ? dec.slice(2) : dec;
    const m = after.match(/^0+/);
    const zeroCount = m ? m[0].length : 0;
    const tail = after.slice(zeroCount);
    const digits = tail.replace(/\D/g, '').slice(0, 4) || '0';

    return (
      <span>
        $0.0{' '}
        <span
          style={{
            fontSize: '0.9em',
            verticalAlign: '-0.25em',
            color: 'inherit',
            fontWeight: 'inherit'
          }}
        >
          {zeroCount}
        </span>{' '}
        {digits}
      </span>
    );
  }

  // Small but not tiny (<1)
  if (abs < 1) return `$${n.toFixed(4)}`;

  // Large suffix rules
  if (abs >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;

  // Normal numbers (clean ".00")
  return `$${Number(n.toFixed(2))}`;
}

export function usdTiny(n: number | null): string {
  if (n == null) return '—';
  if (n < 1) return `$${n.toFixed(6)}`;
  if (n < 10) return `$${n.toFixed(4)}`;
  if (n < 1000) return `$${n.toFixed(2)}`;
  return '$' + compact(n);
}

function compact(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(n);
}
