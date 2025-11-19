import React from 'react';
import Image from 'next/image';

type Holder = {
  rank: number;
  wallet: string;
  amount: string;
  balance: string;
  value: string;
};

interface Props {
  holders: Holder[];
}

const HoldersTable: React.FC<Props> = ({ holders }) => {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/10 text-white/40">
          <th className="py-3 text-left">Rank</th>
          <th className="py-3 text-left">Holder</th>
          <th className="py-3 text-right">Amount</th>
          <th className="py-3 text-right">Balance (%)</th>
          <th className="py-3 text-right">Value</th>
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

            <td className="py-3 text-right">{h.amount}</td>
            <td className="py-3 text-right">{h.balance}</td>
            <td className="py-3 text-right">{h.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default HoldersTable;
