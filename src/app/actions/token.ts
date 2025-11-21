'use server';

import axios, { AxiosResponse } from 'axios';
import { StatusCodes } from 'http-status-codes';
import type { TokenMetadata } from '@/types/api';

const API_BASE =
  process.env.LOOTER_API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? 'https://server23.looter.ai/evm-chart-api/';

export async function fetchTokenMetadataFromApi(address: string): Promise<TokenMetadata> {
  if (!address) {
    throw new Error('Token address is required');
  }

  console.log('wang_url', `${API_BASE}/api/info/token/${address}`);
  const res: AxiosResponse<Partial<TokenMetadata>> = await axios.get<Partial<TokenMetadata>>(
    `${API_BASE}/api/info/token/${address}`
  );

  if (res.status !== StatusCodes.OK) {
    throw new Error('Looter API returned unsuccessful response');
  }

  const fromApis = res.data ?? {};

  console.log('wang_fromApis', fromApis);

  const normalized: TokenMetadata = {
    token_name: fromApis.token_name ?? 'Noot Noot',
    symbol: fromApis.symbol ?? 'NOOT',
    decimals: fromApis.decimals ?? 8,
    address: fromApis.address ?? address
  };

  return normalized;
}
