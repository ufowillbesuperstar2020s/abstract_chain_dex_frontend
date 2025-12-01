import React from 'react';
import Image from 'next/image';
import { shortAddress } from '@/utils/shortAddress';
import Spinner from '@/components/ui/Spinner';

type Holder = {
  rank: number;
  wallet: string;
  amount: string;
  balance: string;
  value: string;
  last_activity_time: string;
};

interface Props {
  holders: Holder[];
  loading: boolean;
  error: string | null;
}

const HoldersTable: React.FC<Props> = ({ holders, loading, error }) => {
  const isEmpty = holders.length === 0;

  return (
    <table className="min-w-full table-fixed text-sm">
      <thead className="sticky top-0 z-20 border-b border-white/10 bg-gray-900">
        <tr className="text-white/40">
          <th className="w-[80px] py-3 text-left font-medium">Rank</th>
          <th className="w-auto py-3 text-left font-medium">Holder</th>
          <th className="py-3 text-left font-medium">Amount</th>
          <th className="py-3 text-left font-medium">Balance (%)</th>
          <th className="py-3 text-left font-medium">Value</th>
          <th className="py-3 text-left font-medium">Activity (Last Seen)</th>
        </tr>
      </thead>

      <tbody>
        {loading && isEmpty && (
          <tr>
            <td colSpan={6} className="py-10 text-center text-white/60">
              <div className="inline-flex items-center gap-2">
                <Spinner className="h-5 w-5" />
                Loading holders…
              </div>
            </td>
          </tr>
        )}

        {!loading && error && isEmpty && (
          <tr>
            <td colSpan={6} className="py-10 text-center text-sm text-red-400">
              {error}
            </td>
          </tr>
        )}

        {!loading &&
          !error &&
          holders.map((h) => (
            <tr key={h.wallet} className="border-b border-white/5">
              <td className="py-3">{h.rank}</td>
              <td className="flex items-center gap-1 py-3">
                <Image src="/images/logo/abs-green.svg" width={4} height={4} alt="" className="h-4 w-4 rounded-full" />
                <span className="text-white">{shortAddress(h.wallet)}</span>
              </td>
              <td className="py-3">{h.amount}</td>
              <td className="py-3">{h.balance}</td>
              <td className="py-3">{h.value}</td>
              <td className="py-3">{h.last_activity_time}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default HoldersTable;
