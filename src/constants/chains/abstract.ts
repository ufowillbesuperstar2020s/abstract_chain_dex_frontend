import { defineChain } from 'viem';

export const abstract = defineChain({
  id: 2741, // mainnet
  name: 'Abstract',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.mainnet.abs.xyz'] },
    public: { http: ['https://api.mainnet.abs.xyz'] }
  },
  blockExplorers: {
    default: { name: 'ABScan', url: 'https://abscan.org' }
  }
});
