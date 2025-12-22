export type PairFilters = {
  market_cap_min?: string;
  market_cap_max?: string;
  volume_min?: string;
  volume_max?: string;
  bond_pprogress_min?: string;
  bond_progress_max?: string;
  age_min?: string;
  age_max?: string;
  holders_min?: string;
  holders_max?: string;
  is_new?: boolean;
};

export const emptyPairFilters: PairFilters = {};

export function countActiveFilters(filters: PairFilters): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== '').length;
}
