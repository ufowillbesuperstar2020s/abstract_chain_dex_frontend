'use client';

import * as React from 'react';
import Pagination from '@/components/explore/Pagination';

type Props = {
  index: number;
  total: number;
  limit: number;
  loading?: boolean;
  onChange: (next: number) => void;
  onPageSizeChange?: (newLimit: number) => void;
  currentCount?: number;
  children?: React.ReactNode;
};

export default function FixedFooter({
  index,
  total,
  limit,
  loading,
  onChange,
  onPageSizeChange,
  currentCount,
  children
}: Props) {
  const pageSizeOptions = [10, 20, 50, 100, 200, 500];
  const computedCount = Math.max(0, Math.min(limit, total - index * limit));
  const resultsOnPage = typeof currentCount === 'number' ? currentCount : computedCount;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#1a1a1a]">
      <div className="w-full px-4">
        <div className="ml-10 flex h-14 items-center gap-4">
          <div className="border-r-2 border-white/10 pr-5 text-base text-white/60">
            Total : {total ? <span>{Intl.NumberFormat().format(total)} </span> : <span>&nbsp;</span>}
          </div>

          <div className="text-base text-white/60">
            Results on page : <span>{Intl.NumberFormat().format(resultsOnPage)}</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Pagination
              index={index}
              total={total}
              limit={limit}
              loading={loading}
              onChange={onChange}
              siblingCount={1}
            />

            <div className="mr-5 flex items-center text-xs text-white/70">
              <select
                value={limit}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="h-8 rounded-md border border-white/10 bg-[#2a2a2a] px-2 text-white outline-none hover:border-white/20"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="ml-2 whitespace-nowrap text-white/60">Items per page</span>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
