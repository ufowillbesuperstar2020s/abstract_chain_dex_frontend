'use client';

import * as React from 'react';
import Pagination from '@/components/explore/Pagination';

type Props = {
  index: number;
  total: number;
  limit: number;
  loading?: boolean;
  onChange: (next: number) => void; // 0-based
  children?: React.ReactNode; // extra right-side controls
};

export default function FixedFooter({ index, total, limit, loading, onChange, children }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#1a1a1a]">
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="text-xs text-white/60">
            {total ? <span>{Intl.NumberFormat().format(total)} results</span> : <span>&nbsp;</span>}
          </div>

          {/* Center: Pagination */}
          <div className="flex-1">
            <Pagination
              index={index}
              total={total}
              limit={limit}
              loading={loading}
              onChange={onChange}
              siblingCount={1}
            />
          </div>

          {/* Right slot */}
          <div className="flex items-center gap-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
