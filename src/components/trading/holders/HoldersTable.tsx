import React from 'react';
import Image from 'next/image';

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
}

const HoldersTable: React.FC<Props> = ({ holders }) => {
  return (
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="border-b border-white/10 text-white/40">
          <th className="w-[80px] py-3 text-left font-medium">Rank</th>
          <th className="w-auto py-3 text-left font-medium">Holder</th>
          <th className="py-3 text-left font-medium">Amount</th>
          <th className="py-3 text-left font-medium">Balance (%)</th>
          <th className="py-3 text-left font-medium">Value</th>
          <th className="py-3 text-left font-medium">Activity (Last Seen)</th>
        </tr>
      </thead>

      <tbody>
        {holders.map((h) => (
          <tr key={h.wallet} className="border-b border-white/5">
            <td className="py-3">{h.rank}</td>

            {/* Holder column */}
            <td className="flex items-center gap-1 py-3">
              <Image
                src="/images/logo/abs-green.svg"
                width={4}
                height={4}
                alt="holder"
                className="h-4 w-4 rounded-full"
              />
              <span className="text-white">{h.wallet}</span>
            </td>

            <td className="py-3 text-left">{h.amount}</td>
            <td className="py-3 text-left">{h.balance}</td>
            <td className="py-3 text-left">{h.value}</td>
            <td className="py-3 text-left">{h.last_activity_time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default HoldersTable;
