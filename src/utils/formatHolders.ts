// src/utils/formatHolders.ts

import { bigBaseUnitsToNumber, formatUsd } from '@/utils/formatters';

export type RawHolder = {
  wallet_address: string;
  remaining: string;
  updated_at: number;
  // other fields exist but we don't care for the table
};

export type UiHolder = {
  rank: number;
  wallet: string;
  amount: string;
  balance: string;
  value: string;
  last_activity_time: string;
};

function formatHolderTimestamp(tsSec: number): string {
  if (!tsSec) return '-';
  const d = new Date(tsSec * 1000);

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();

  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  // 05-17-2025  |  18:21:53
  return `${mm}-${dd}-${yyyy}  |  ${hh}:${mi}:${ss}`;
}

/**
 * Convert raw holders → UI rows for HoldersTable.
 */
export function transformHoldersToUi(
  raw: RawHolder[],
  decimals: number,
  totalSupplyHuman: number | null | undefined,
  tokenPriceUsd: number | null | undefined,
  tokenSymbol: string
): UiHolder[] {
  const price = tokenPriceUsd ?? 0;

  // Parse and convert remaining → human amount
  const parsed = raw
    .map((h) => {
      const amountNum = bigBaseUnitsToNumber(h.remaining, decimals);
      return {
        wallet: h.wallet_address,
        amountNum,
        updated_at: h.updated_at
      };
    })
    .filter((h) => h.amountNum > 0);

  // Sort by amount DESC
  parsed.sort((a, b) => b.amountNum - a.amountNum);

  // If supplyHuman is missing, fall back to sum of holders
  const explicitSupply = totalSupplyHuman ?? 0;
  const effectiveSupply = explicitSupply > 0 ? explicitSupply : parsed.reduce((sum, h) => sum + h.amountNum, 0);

  return parsed.map((h, index) => {
    const balancePct = effectiveSupply > 0 ? (h.amountNum / effectiveSupply) * 100 : 0;
    const valueUsd = h.amountNum * price;

    const amountStr = `${h.amountNum.toLocaleString(undefined, {
      maximumFractionDigits: 4
    })} ${tokenSymbol}`;

    const balanceStr = `${balancePct.toFixed(2)}%`;

    const valueStr = formatUsd(valueUsd, 0); // e.g. $1,275,000

    const lastSeen = formatHolderTimestamp(h.updated_at);

    return {
      rank: index + 1,
      wallet: h.wallet,
      amount: amountStr,
      balance: balanceStr,
      value: valueStr,
      last_activity_time: lastSeen
    };
  });
}
