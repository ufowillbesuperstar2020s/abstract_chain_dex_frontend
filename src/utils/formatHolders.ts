import { bigBaseUnitsToNumber } from '@/utils/formatters';
import { format } from 'date-fns';

export function formatTimestamp(ts: number) {
  return format(new Date(ts * 1000), 'MM-dd-yyyy | HH:mm:ss');
}

export function transformHolders(raw: any[], decimals: number, totalSupply: number, price: number) {
  const parsed = raw.map((h) => {
    const amount = bigBaseUnitsToNumber(h.remaining, decimals);
    return {
      wallet: h.wallet_address,
      amountNum: amount,
      updated_at: h.updated_at
    };
  });

  parsed.sort((a, b) => b.amountNum - a.amountNum);

  return parsed.map((h, i) => {
    const balance = (h.amountNum / totalSupply) * 100;
    const value = h.amountNum * price;

    return {
      rank: i + 1,
      wallet: h.wallet,
      amount: h.amountNum.toLocaleString(undefined, { maximumFractionDigits: 4 }),
      balance: balance.toFixed(2) + '%',
      value: '$' + value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      last_activity_time: formatTimestamp(h.updated_at)
    };
  });
}
