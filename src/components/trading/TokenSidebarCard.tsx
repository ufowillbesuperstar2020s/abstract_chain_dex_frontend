"use client";

import React from "react";

type Pct = { value: number; label: string; hint?: string };
type Count = { value: number | string; label: string; accent?: "default" | "ok" | "warn" | "danger" };

type AddressItem = {
  label: string;     // e.g. "CA", "DA"
  value: string;     // the address
  suffix?: string;   // e.g. "...pump", "4mo"
  href?: string;     // external link for the address
};

export type TokenSidebarCardProps = {
  tokenName: string;                        // "Lucius"
  buyCtaText?: string;                      // defaults to "Buy <tokenName>"
  stats: { bought: number; sold: number; holding: number; pnlUsd: number; pnlPct: number };
  presets?: string[];                       // e.g. ["PRESET 1","PRESET 2","PRESET 3"]
  activePresetIndex?: number;               // default 0
  onPresetChange?: (index: number) => void;

  // Top "Token Info" metric tiles (3 columns)
  infoMetrics: Pct[];                       // e.g. [{value:3.01,label:"Top 10 H."}, ...]
  // Secondary counts row
  counts: Count[];                          // e.g. [{value:4,label:"Holders"}, {value:3,label:"Pro Traders"}, {value:"Unpaid",label:"Dex Paid",accent:"danger"}]

  addresses: AddressItem[];                 // e.g. [{label:"CA", value:"4pJs1TQp...", suffix:"…pump", href:"https://..."}]

  // Actions to wire later:
  onBuy?: () => void;
  onRefreshInfo?: () => void;
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full bg-emerald-500 text-black font-medium text-sm py-2.5 text-center">
      {children}
    </div>
  );
}

function SmallStat({ label, value, accent = "default" as const }: {
  label: string;
  value: number | string;
  accent?: "default" | "ok" | "warn" | "danger";
}) {
  const color =
    accent === "ok" ? "text-emerald-400" :
    accent === "danger" ? "text-rose-400" :
    "text-indigo-300";
  return (
    <div className="flex flex-col items-center rounded-md border border-white/10 bg-white/5 px-2 py-2">
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-400">{label}</div>
    </div>
  );
}

function MetricTile({ value, label, hint }: Pct) {
  return (
    <div className="rounded-md border border-white/10 dark:bg-gray-900 p-3">
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 text-sm font-semibold">{value.toFixed(2)}%</span>
        {hint ? <span className="text-[11px] text-gray-500">{hint}</span> : null}
      </div>
      <div className="mt-1 text-xs text-gray-300">{label}</div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        } catch {}
      }}
      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 hover:bg-white/10"
      title="Copy"
      aria-label="Copy"
      type="button"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ExternalLink({ href }: { href?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 hover:bg-white/10"
      title="Open in new tab"
    >
      Open
    </a>
  );
}

export default function TokenSidebarCard({
  tokenName,
  buyCtaText,
  stats,
  presets = ["PRESET 1", "PRESET 2", "PRESET 3"],
  activePresetIndex = 0,
  onPresetChange,
  infoMetrics,
  counts,
  addresses,
  onBuy,
  onRefreshInfo,
}: TokenSidebarCardProps) {
  const pnlColor = stats.pnlUsd >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <aside className="rounded-2xl border border-white/10 dark:bg-gray-900 p-4 space-y-4">
      {/* Buy CTA */}
      <Pill>
        {buyCtaText ?? `Buy ${tokenName}`}
      </Pill>

      {/* Compact stats row */}
      <div className="grid grid-cols-4 gap-2">
        <SmallStat label="Bought"  value={stats.bought} />
        <SmallStat label="Sold"    value={stats.sold}   accent="danger" />
        <SmallStat label="Holding" value={stats.holding} />
        <div className="flex flex-col items-center rounded-md border border-white/10 bg-white/5 px-2 py-2">
          <div className={`text-sm font-semibold ${pnlColor}`}>
            {stats.pnlUsd >= 0 ? "+" : "-"}${Math.abs(stats.pnlUsd).toFixed(0)} ({stats.pnlPct >= 0 ? "+" : ""}{stats.pnlPct.toFixed(1)}%)
          </div>
          <div className="text-[11px] text-gray-400">PnL</div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex items-center gap-2">
        {presets.map((p, i) => (
          <button
            key={p}
            onClick={() => onPresetChange?.(i)}
            className={[
              "rounded-md px-3 py-1.5 text-xs",
              i === activePresetIndex ? "bg-white/10 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10",
            ].join(" ")}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Token Info + refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">Token Info</div>
        <button
          type="button"
          onClick={onRefreshInfo}
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300 hover:bg-white/10"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Metric tiles (3 columns) */}
      <div className="grid grid-cols-3 gap-2">
        {infoMetrics.map((m, idx) => (
          <MetricTile key={idx} {...m} />
        ))}
      </div>

      {/* Counts row */}
      <div className="grid grid-cols-3 gap-2">
        {counts.map((c, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-md border border-white/10 bg-white/5 px-3 py-3"
          >
            <div
              className={[
                "text-sm font-semibold",
                c.accent === "ok" ? "text-emerald-400" :
                c.accent === "danger" ? "text-rose-400" :
                "text-indigo-300",
              ].join(" ")}
            >
              {c.value}
            </div>
            <div className="text-[11px] text-gray-400">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Addresses */}
      <div className="space-y-2">
        {addresses.map((a, i) => (
          <div key={i} className="rounded-md border border-white/10 dark:bg-gray-900 px-3 py-2">
            <div className="text-[11px] text-gray-400 mb-1">{a.label}</div>
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-xs text-gray-200">
                {a.value}
                {a.suffix ? <span className="text-gray-500"> {a.suffix}</span> : null}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CopyButton text={a.value} />
                <ExternalLink href={a.href} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action (wire later) */}
      <button
        onClick={onBuy}
        className="w-full rounded-md border border-emerald-500/30 bg-emerald-500/10 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20"
      >
        Execute in Silence
      </button>
    </aside>
  );
}
