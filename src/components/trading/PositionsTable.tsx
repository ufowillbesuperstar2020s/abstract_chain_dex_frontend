'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import cx from 'clsx';

import { useAuthStore } from '@/app/stores/auth-store';
import { usePositionsStore, type ApiPosition } from '@/app/stores/positions-store';
// import { shortAddress } from '@/utils/shortAddress';

/** Optional props:
 * - tokenAddress: if provided, we only show the position for this token.
 *   Useful on /token/[token_address] page.
 * - walletAddress: override connected wallet (fallback to useAuthStore).
 */
type Props = {
  tokenAddress?: string;
  walletAddress?: string;
};

/** ------- local format helpers (kept self-contained) ------- */
// function fmtUSD(n?: number) {
//   const v = Number(n ?? 0);
//   const sign = v < 0 ? '-' : '';
//   const abs = Math.abs(v);
//   return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// }
// function fmtUSDRaw(n?: number) {
//   const v = Math.abs(Number(n ?? 0));
//   return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// }
// function fmtNumber(n?: number, maxFraction = 4) {
//   const v = Number(n ?? 0);
//   if (!Number.isFinite(v)) return '0';
//   return v.toLocaleString(undefined, { maximumFractionDigits: maxFraction });
// }

/** Convert a raw string (likely wei) to a human number assuming 18 decimals by default. */
function humanFromRaw(raw: string, decimals = 18): number {
  if (!raw) return 0;
  try {
    const bn = BigInt(raw);
    const div = BigInt(10) ** BigInt(decimals);
    // Avoid BigInt -> float precision for huge amounts: split integer + fraction
    const intPart = Number(bn / div);
    const fracPart = Number(bn % div) / Number(div);
    return intPart + fracPart;
  } catch {
    // Fallback if not an integer-like string
    const asFloat = parseFloat(raw);
    return Number.isFinite(asFloat) ? asFloat : 0;
  }
}

/** Safely parse numbers from API's decimal strings */
function toNum(s?: string): number {
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function Th(props: React.HTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props;
  return <th className={cx('px-4 py-2 font-medium text-white/70', className)} {...rest} />;
}

export default function PositionsTable({ tokenAddress, walletAddress }: Props) {
  // const connected = useAuthStore((s) => s.isConnected);
  const connectedAddr = useAuthStore((s) => s.address ?? undefined);
  const wallet = walletAddress ?? connectedAddr;

  const fetchPositions = usePositionsStore((s) => s.fetchPositions);
  const rowsByWallet = usePositionsStore((s) => s.positionsByWallet);
  const loadingByWallet = usePositionsStore((s) => s.loadingByWallet);
  const errorByWallet = usePositionsStore((s) => s.errorByWallet);

  React.useEffect(() => {
    if (!wallet) return;
    void fetchPositions(wallet);
  }, [wallet, fetchPositions]);

  if (!wallet) {
    return (
      <div className="rounded-md border border-white/10 p-6 text-sm text-white/60">
        Connect your wallet to see positions.
      </div>
    );
  }

  const loading = !!loadingByWallet[wallet];
  const error = errorByWallet[wallet] ?? null;
  let data = (rowsByWallet[wallet] ?? []) as ApiPosition[];

  if (tokenAddress) {
    const t = tokenAddress.toLowerCase();
    data = data.filter((p) => p.token_address?.toLowerCase() === t);
  }

  // Map API rows to display rows, computing PnL
  const rows = React.useMemo(() => {
    const list = (data ?? [])
      .map((p) => {
        const cost = toNum(p.cost); // USD
        const currentValue = toNum(p.current_value); // USD
        const pnlAbs = currentValue - cost;
        const pnlPct = cost > 0 ? pnlAbs / cost : 0;

        const balance = humanFromRaw(p.balance, 18);
        const entryPerToken = toNum(p.entry_price) * Math.pow(10, 18);

        return {
          tokenAddress: p.token_address,
          balance,
          costBasis: cost,
          currentValue,
          entryPrice: entryPerToken,
          pnlAbs,
          pnlPct
        };
      })
      .sort((a, b) => b.currentValue - a.currentValue);

    return list;
  }, [data]);

  if (loading) {
    return <div className="rounded-md border border-white/10 p-6 text-sm text-white/60">Loading positions…</div>;
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        Failed to load positions: {error}
      </div>
    );
  }
  if (!rows.length) {
    return <div className="rounded-md border border-white/10 p-6 text-sm text-white/60">No open positions yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-white/10">
      <table className="w-full table-fixed">
        <thead className="bg-white/5 text-[11px] tracking-wide text-white/60">
          <tr>
            <Th className="w-[15%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_token_name.svg" alt="" className="mr-1 h-4 w-4" />
                Token name
              </div>
            </Th>
            <Th className="w-[12%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_balance.svg" alt="" className="mr-1 h-4 w-4" />
                Balance
              </div>
            </Th>
            <Th className="w-[16%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_current_value.svg" alt="" className="mr-1 h-4 w-4" />
                Current Value
              </div>
            </Th>
            <Th className="w-[16%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_current_value.svg" alt="" className="mr-1 h-4 w-4" />
                Cost Basis
              </div>
            </Th>
            <Th className="w-[14%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_entry_price.svg" alt="" className="mr-1 h-4 w-4" />
                Entry Price
              </div>
            </Th>
            <Th className="w-[10%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_PnL.svg" alt="" className="mr-1 h-4 w-4" />
                PnL
              </div>
            </Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r) => (
            <tr key={r.tokenAddress} className="text-sm">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Image width={4} height={4} src="/images/icons/token_dollars.svg" alt="" className="mr-1 h-4 w-4" />
                  <div className="min-w-0">
                    <Link href={`/token/${r.tokenAddress}`} className="truncate text-white hover:underline">
                      {/* wang_ {shortAddress(r.tokenAddress)} */}
                      Noot
                    </Link>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-left text-white tabular-nums">
                {/* wang_ {fmtNumber(r.balance, 6)} */}
                150
              </td>
              <td className="px-4 py-3 text-left text-white tabular-nums">
                {/* wang_ {fmtUSD(r.currentValue)} */}
                $15
              </td>
              <td className="px-4 py-3 text-left text-white tabular-nums">
                {/* wang_ {fmtUSD(r.costBasis)} */}
                $12
              </td>
              <td className="px-4 py-3 text-left text-white tabular-nums">
                {/* wang_ {fmtUSD(r.entryPrice)} */}
                $12
              </td>

              <td className="px-4 py-3 text-left">
                <div
                  className={cx(
                    'inline-flex items-center justify-end gap-2 rounded-xl px-2 py-0.5 text-sm tabular-nums',
                    r.pnlAbs >= 0 ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'
                  )}
                >
                  <span>
                    {/* wang_ {(r.pnlAbs >= 0 ? '+' : '') + fmtUSDRaw(r.pnlAbs)} */}
                    +$5
                  </span>
                  <span className="text-[11px] opacity-80">
                    {/* wang_ {(r.pnlPct >= 0 ? '+' : '') + (r.pnlPct * 100).toFixed(2)}% */}
                    +14%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
