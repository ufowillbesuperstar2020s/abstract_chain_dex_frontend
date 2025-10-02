export type Transaction = {
  pair_address: string;
  tx_type: string;
  price_native: string; // big decimal (string)
  price_usd: string; // big decimal (string)
  amount: string; // base units, stringified integer
  decimals: number;
  wallet_address: string;
  tx_hash: string;
  block_number: number;
  timestamp: number;
};
