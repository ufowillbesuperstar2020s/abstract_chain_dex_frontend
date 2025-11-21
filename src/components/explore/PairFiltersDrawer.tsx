'use client';

import * as React from 'react';
import { PairFilters } from '@/utils/pairFilters';

type Props = {
  open: boolean;
  draft: PairFilters;
  onChangeDraft: (next: PairFilters) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
};

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

function NumberRangeRow(props: {
  label: string;
  prefix?: string;
  minKey: keyof PairFilters;
  maxKey: keyof PairFilters;
  draft: PairFilters;
  onChangeDraft: (next: PairFilters) => void;
}) {
  const { label, prefix, minKey, maxKey, draft, onChangeDraft } = props;

  const handleChange = (key: keyof PairFilters) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeDraft({ ...draft, [key]: e.target.value });
  };

  const minVal = draft[minKey] ?? '';
  const maxVal = draft[maxKey] ?? '';

  return (
    <div className="mb-4">
      <div className="mb-2 text-sm text-white/80">{label}</div>
      <div className="flex gap-4">
        <div className="flex-1 bg-[#393D42] text-sm text-white/80">
          <div className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2">
            {prefix && <span className="text-sm text-emerald-500">{prefix}</span>}
            <input
              type="text"
              inputMode="decimal"
              className="w-full bg-transparent text-sm text-white/80 outline-none placeholder:text-white/30"
              placeholder="—"
              value={minVal}
              onChange={handleChange(minKey)}
            />
          </div>
        </div>

        <div className="flex-1 bg-[#393D42] text-sm text-white/80">
          <div className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2">
            {prefix && <span className="mr-1 text-emerald-500">{prefix}</span>}
            <input
              type="text"
              inputMode="decimal"
              className="w-full bg-transparent text-sm text-white/80 outline-none placeholder:text-white/30"
              placeholder="—"
              value={maxVal}
              onChange={handleChange(maxKey)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PairFiltersDrawer({ open, draft, onChangeDraft, onClose, onApply, onReset }: Props) {
  return (
    <div
      className={cx(
        'pointer-events-none absolute inset-0 top-[52px] right-0 flex items-start justify-end',
        open && 'pointer-events-auto'
      )}
    >
      {/* sliding panel */}
      <div
        className={cx(
          'pointer-events-auto relative mr-0 max-h-[720px] w-[300px] rounded-xl bg-[#393D42] p-4 shadow-xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md text-white/60 hover:bg-white/10 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        </div>

        <div className="h-[calc(100%-4rem)] overflow-y-auto pr-1 text-sm">
          <NumberRangeRow
            label="Market Cap"
            prefix="$"
            minKey="market_cap_min"
            maxKey="market_cap_max"
            draft={draft}
            onChangeDraft={onChangeDraft}
          />

          <NumberRangeRow
            label="Volume"
            prefix="$"
            minKey="volume_min"
            maxKey="volume_max"
            draft={draft}
            onChangeDraft={onChangeDraft}
          />

          <NumberRangeRow
            label="Bond Progress"
            minKey="bond_pprogress_min"
            maxKey="bond_progress_max"
            draft={draft}
            onChangeDraft={onChangeDraft}
          />

          <NumberRangeRow label="Age" minKey="age_min" maxKey="age_max" draft={draft} onChangeDraft={onChangeDraft} />

          <NumberRangeRow
            label="Holders"
            minKey="holders_min"
            maxKey="holders_max"
            draft={draft}
            onChangeDraft={onChangeDraft}
          />
        </div>

        <div className="mt-4 ml-2 flex items-center justify-between">
          <button type="button" onClick={onReset} className="text-sm text-white/90 underline-offset-2 hover:text-white">
            ⟳ Reset
          </button>

          <button
            type="button"
            onClick={onApply}
            className="rounded-xl bg-emerald-400 px-4 py-1.5 text-sm font-medium hover:bg-emerald-500"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
