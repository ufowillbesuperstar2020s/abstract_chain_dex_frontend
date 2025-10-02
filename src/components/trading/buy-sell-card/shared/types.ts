export type TradeType = "BUY" | "SELL";
export type OrderType = "market" | "limit" | "dca";

export type TradeConfig = {
  type: TradeType;
  orderType: OrderType;
  slippageBps: number;      // 100 = 1%
  feeBps: number;           // indicative, not used yet
};

export const TABS = ["Market", "Limit"] as const;
export type TabItem = (typeof TABS)[number];

export const PRESET_TABS = ["Preset1", "Preset2", "Preset3"] as const;
export type PresetTabItem = (typeof PRESET_TABS)[number];

export const TRADE_CONFIGS: Record<TradeType, TradeConfig> = {
  BUY:  { type: "BUY",  orderType: "market", slippageBps: 50,  feeBps: 0 },
  SELL: { type: "SELL", orderType: "market", slippageBps: 50,  feeBps: 0 },
};
