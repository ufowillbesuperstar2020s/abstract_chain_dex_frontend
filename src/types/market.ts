export type TradeWindowKey = '_1h' | '_4h' | '_12h' | '_1d';

export type TradeWindow = {
  buy_count?: string | number;
  sell_count?: string | number;
  buy_vol?: string;
  sell_vol?: string;
  close_price?: string;
  high_price?: string;
  low_price?: string;
  open_price?: string;
  trades_count?: string | number;
};

export type MarketApiToken = {
  created_at?: string;
  dev_holders_remaining?: string;
  holders_count?: string | number;
  liquidity?: string;
  migrate?: string;
  price?: string;
  snipers_remaining?: string;
  top_holders_remaining?: string;
  total_supply?: string;
  weth_usd_price?: string;
  buy_count?: number;
  sell_count?: number;
  buy_volume?: string;
  sell_volume?: string;
  tx_count?: number;
};

export type MarketApiTrade = Partial<Record<TradeWindowKey, TradeWindow>>;

export type MarketApiResponse = {
  token?: MarketApiToken;
  trade?: MarketApiTrade;
};
