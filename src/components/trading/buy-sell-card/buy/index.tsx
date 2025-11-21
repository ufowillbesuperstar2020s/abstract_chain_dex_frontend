'use client';

import TradeInterface from '../shared/TradeInterface';
import type { AbstractSwapResult } from '@/types/api';
import axios, { AxiosResponse } from 'axios';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useTradeSettingsStore } from '@/app/stores/tradeSettings-store';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { defaultExplorerBase, showTxToast } from '@/components/ui/toast/TxToast';
import type { Address, Hash, Hex } from 'viem';
import { getSwapQuote } from '@/app/actions/getSwapQuote';

type AbstractSwapRequest = {
  wallet_address: string;
  token_address: string;
  amount_in: string;
  is_sell: boolean;
  slippage: number;
};

const API_SWAP = process.env.NEXT_PUBLIC_API_SWAP ?? 'https://server23.looter.ai/abs-swap-api';

export default function Buy() {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const slippagePct = useTradeSettingsStore((s) => s.slippagePct);
  const tokenAddress = useTokenInfoStore((s) => s.tokenAddress);

  return (
    <TradeInterface
      tradeType="BUY"
      onSubmit={async (p) => {
        const amount: string = p.amount.toString();
        const slippage = Number.isFinite(slippagePct) ? slippagePct : 20;

        const amountInOfBigInt: bigint = parseEther(amount);
        const amountIn: string = amountInOfBigInt.toString();

        if (!address) {
          throw new Error('Wallet not connected');
        }

        if (!tokenAddress) throw new Error('Token address not resolved yet');

        const payload: AbstractSwapRequest = {
          wallet_address: address,
          token_address: tokenAddress,
          amount_in: amountIn,
          is_sell: false,
          slippage: slippage
        };

        try {
          const quote = await getSwapQuote(payload);

          if (!quote.ok) {
            console.error(quote.error);
            return;
          }

          const swap_tx = quote.data.txs?.swap;

          if (swap_tx) {
            const to: Address = swap_tx.to as Address;
            const data: Hex = swap_tx.input as Hex;
            const value = swap_tx.value ? BigInt(swap_tx.value) : undefined;

            const hash: Hash = await sendTransactionAsync({
              to,
              value,
              data
            });

            showTxToast({
              kind: 'BUY',
              title: 'Buy Success!',
              hash,
              explorerBase: defaultExplorerBase(),
              ttlMs: 10000
            });
          }
        } catch (err) {
          if (axios.isAxiosError(err)) {
            console.error('Request failed:', err.response?.data ?? err.message);
          } else {
            console.error(err);
          }
        }
      }}
    />
  );
}
