"use client";

import { useState, memo } from "react";

export default memo(function AmountInput({
  placeholder = "Amount",
  value,
  onChange
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <div
        className={[
          "flex items-center gap-2 rounded-xl px-3",
          "bg-[rgba(119,136,159,0.08)]",
          "ring-1 ring-inset",
          focused ? "ring-emerald-400/40" : "ring-white/40",
        ].join(" ")}
      >
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/30"
        />
      </div>
    </div>
  );
});