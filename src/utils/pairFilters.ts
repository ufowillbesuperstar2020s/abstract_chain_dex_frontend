export type PairFilters = {
  marketCapMin?: string;
  marketCapMax?: string;
  volumeMin?: string;
  volumeMax?: string;
  bondProgressMin?: string;
  bondProgressMax?: string;
  ageMin?: string;
  ageMax?: string;
  holdersMin?: string;
  holdersMax?: string;
};

export const emptyPairFilters: PairFilters = {};

// Build the querystring part that will be appended to /pair/list
// Example output: &market_cap_min=123&market_cap_max=456&volumn_min=1
export function buildPairFiltersQuery(filters: PairFilters): string {
  const params = new URLSearchParams();

  const add = (value: string | undefined, key: string) => {
    if (value !== undefined && value !== '') {
      params.set(key, value);
    }
  };

  add(filters.marketCapMin, 'market_cap_min');
  add(filters.marketCapMax, 'market_cap_max');

  add(filters.volumeMin, 'volumn_min');
  add(filters.volumeMax, 'volumn_max');

  add(filters.bondProgressMin, 'bond_progress_min');
  add(filters.bondProgressMax, 'bond_progress_max');

  add(filters.ageMin, 'age_min');
  add(filters.ageMax, 'age_max');

  add(filters.holdersMin, 'holders_min');
  add(filters.holdersMax, 'holders_max');

  const qs = params.toString();
  return qs ? `&${qs}` : '';
}

export function countActiveFilters(filters: PairFilters): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== '').length;
}
