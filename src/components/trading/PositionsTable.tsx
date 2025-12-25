'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import cx from 'clsx';

import { useAuthStore } from '@/app/stores/auth-store';
import { usePositionsStore, type ApiPosition } from '@/app/stores/positions-store';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { useTokenMetricsStore } from '@/app/stores/tokenMetrics-store';
import { usdTiny } from '@/utils/fmtUSD';

type Props = {
  tokenAddress?: string;
  walletAddress?: string;
};

type Row = {
  tokenAddress: string;
  tokenSymbol: string;
  balance: number;
  currentValueUsd: number;
  costBasisUsd: number;
  entryPriceUsd: number;
  pnlAbsUsd: number;
  pnlPct: number;
};

function humanFromRaw(raw: string, decimals: number): number {
  if (!raw) return 0;

  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    return asNumber / Math.pow(10, decimals);
  }

  const len = raw.length;
  if (len <= decimals) {
    return Number(`0.${raw.padStart(decimals, '0')}`);
  }

  const intPart = raw.slice(0, len - decimals);
  const fracPart = raw.slice(len - decimals);
  return Number(intPart + '.' + fracPart);
}

function toNum(v?: string | number | null): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtNumber(n: number, maxFraction = 6): string {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString(undefined, { maximumFractionDigits: maxFraction });
}

function Th(props: React.HTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props;
  return <th className={cx('px-4 py-2 font-medium text-white/70', className)} {...rest} />;
}

export default function PositionsTable({ tokenAddress, walletAddress }: Props) {
  const connectedAddr = useAuthStore((s) => s.address ?? undefined);
  const wallet = walletAddress ?? connectedAddr;

  const fetchPositions = usePositionsStore((s) => s.fetchPositions);
  const rowsByWallet = usePositionsStore((s) => s.positionsByWallet);
  const loadingByWallet = usePositionsStore((s) => s.loadingByWallet);
  const errorByWallet = usePositionsStore((s) => s.errorByWallet);

  // Single-token (token page) fields (fallback)
  const tokenMetaSingle = useTokenInfoStore((s) => s.tokenMetadata);
  const metricsSingle = useTokenMetricsStore((s) => s.metrics);

  // ✅ IMPORTANT: subscribe to maps so component re-renders when they update
  const metaMap = useTokenInfoStore((s) => s.metaMap);
  const metricsMap = useTokenMetricsStore((s) => s.metricsMap);

  // loaders
  const loadTokenMetadata = useTokenInfoStore((s) => s.loadTokenMetadata);
  const loadMetrics = useTokenMetricsStore((s) => s.loadMetrics);

  React.useEffect(() => {
    if (!wallet) return;
    void fetchPositions(wallet);
  }, [wallet, fetchPositions]);

  const loading = wallet ? !!loadingByWallet[wallet] : false;
  const error = wallet ? (errorByWallet[wallet] ?? null) : null;
  const rawData: ApiPosition[] = wallet ? (rowsByWallet[wallet] ?? []) : [];

  const filteredData: ApiPosition[] = React.useMemo(() => {
    if (!tokenAddress) return rawData;
    const t = tokenAddress.toLowerCase();
    return rawData.filter((p) => p.token_address.toLowerCase() === t);
  }, [rawData, tokenAddress]);

  // load meta + metrics for every token in positions (portfolio needs this)
  React.useEffect(() => {
    if (!filteredData.length) return;

    const uniq = Array.from(new Set(filteredData.map((p) => p.token_address.toLowerCase())));

    void (async () => {
      for (const addr of uniq) {
        await loadTokenMetadata(addr);
        await loadMetrics(addr);
      }
    })();
  }, [filteredData, loadTokenMetadata, loadMetrics]);

  const rows: Row[] = React.useMemo(() => {
    // console.log('wang_filteredData', filteredData);
    return filteredData
      .map<Row>((p) => {
        const addr = p.token_address.toLowerCase();

        // ✅ per-token meta (from metaMap) or fallback
        const meta = metaMap[addr] ?? tokenMetaSingle;
        const decimals = meta?.decimals ?? 18;
        const tokenSymbol = meta?.symbol ?? 'Token';

        // ✅ per-token metrics (from metricsMap) or
        // console.log('wang_addr', addr);
        const mLite = metricsMap[addr];

        // console.log('wang_mLite', mLite);
        // console.log('wang_mLite', mLite);
        console.log('wang_metricsSingle', metricsSingle);

        const tokenPriceUsd = mLite?.usdPrice ?? metricsSingle?.usdPrice ?? 0;
        // console.log('wang_tokenPriceUsd', tokenPriceUsd);

        const balance = humanFromRaw(p.current_value, decimals);
        const currentValueUsd = balance * tokenPriceUsd;

        const costBasisUsd = toNum(p.cost);
        const entryPriceUsd = balance > 0 ? costBasisUsd / balance : 0;

        const pnlAbsUsd = currentValueUsd - costBasisUsd;
        const pnlPct = costBasisUsd > 0 ? pnlAbsUsd / costBasisUsd : 0;

        return {
          tokenAddress: p.token_address,
          tokenSymbol,
          balance,
          currentValueUsd,
          costBasisUsd,
          entryPriceUsd,
          pnlAbsUsd,
          pnlPct
        };
      })
      .sort((a, b) => b.currentValueUsd - a.currentValueUsd);
  }, [filteredData, metaMap, metricsMap, tokenMetaSingle, metricsSingle]);

  if (!wallet) {
    return (
      <div className="rounded-md border border-white/10 p-6 text-sm text-white/60">
        Connect your wallet to see positions.
      </div>
    );
  }

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
            <Th className="w-[12%] text-left">
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
            <Th className="w-[14%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_current_value.svg" alt="" className="mr-1 h-4 w-4" />
                Current Value
              </div>
            </Th>
            <Th className="w-[15%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_current_value.svg" alt="" className="mr-1 h-4 w-4" />
                Cost Basis
              </div>
            </Th>
            <Th className="w-[13%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_entry_price.svg" alt="" className="mr-1 h-4 w-4" />
                Entry Price
              </div>
            </Th>
            <Th className="w-[14%] text-left">
              <div className="flex">
                <Image width={4} height={4} src="/images/icons/th_PnL.svg" alt="" className="mr-1 h-4 w-4" />
                PnL
              </div>
            </Th>
            <Th className="w-[3%] text-left"></Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {rows.map((r) => (
            <tr key={r.tokenAddress + String(r.entryPriceUsd)} className="text-sm">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Image width={4} height={4} src="/images/icons/token_dollars.svg" alt="" className="mr-1 h-4 w-4" />
                  <div className="min-w-0">
                    <Link href={`/token/${r.tokenAddress}`} className="truncate text-white hover:underline">
                      {r.tokenSymbol}
                    </Link>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-left text-white tabular-nums">{fmtNumber(r.balance, 6)}</td>
              <td className="px-4 py-3 text-left text-white tabular-nums">{usdTiny(r.currentValueUsd)}</td>
              <td className="px-4 py-3 text-left text-white tabular-nums">{usdTiny(r.costBasisUsd)}</td>
              <td className="px-4 py-3 text-left text-white tabular-nums">{usdTiny(r.entryPriceUsd)}</td>

              <td className="py-3 pl-4">
                <div className="inline-flex shrink-0 items-center justify-end gap-1 rounded-xl py-0.5 pl-2 text-sm text-white">
                  <span>{(r.pnlAbsUsd >= 0 ? '+' : '-') + usdTiny(Math.abs(r.pnlAbsUsd))}</span>
                  <span>/</span>
                  <span>{(r.pnlPct >= 0 ? '+' : '') + (r.pnlPct * 100).toFixed(2)}%</span>
                </div>
              </td>

              <td className="text-left">
                {r.pnlAbsUsd >= 0 ? (
                  <i className="fa-notdog-duo fa-solid fa-angle-up text-emerald-600"></i>
                ) : (
                  <i className="fa-notdog-duo fa-solid fa-angle-down text-[rgba(255,68,0,1)]"></i>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
