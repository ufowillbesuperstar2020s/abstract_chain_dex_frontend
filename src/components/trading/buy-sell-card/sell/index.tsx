'use client';

import TradeInterface from '../shared/TradeInterface';
import type { AbstractSwapResult } from '@/types/api';
import axios, { AxiosResponse } from 'axios';

import { useAccount, useSendTransaction, useSendCalls, usePublicClient } from 'wagmi';
import { useAbstractClient } from '@abstract-foundation/agw-react';
import { parseUnits, encodeFunctionData } from 'viem';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';
import { useTradeSettingsStore } from '@/app/stores/tradeSettings-store';
import { defaultExplorerBase, showTxToast } from '@/components/ui/toast/TxToast';
import type { Address, Hash, Hex } from 'viem';

const API_SWAP = process.env.NEXT_PUBLIC_API_SWAP ?? 'https://server23.looter.ai/abs-swap-api';

// Minimal ABI (approve + decimals)
const erc20Abi = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  }
] as const;

type AbstractSwapRequest = {
  wallet_address: string;
  token_address: string;
  amount_in: string; // base units (stringified)
  is_sell: boolean;
  slippage: number;
};

type PreparedTx = {
  to: `0x${string}`;
  input: `0x${string}`;
  value?: string | number | bigint | null;
};

// --- helper: normalize sendCallsAsync return to a bundle id ---
function getBundleId(ret: unknown): `0x${string}` {
  if (typeof ret === 'string') return ret as `0x${string}`;
  if (ret && typeof ret === 'object' && 'id' in ret && typeof (ret as { id: unknown }).id === 'string') {
    return (ret as { id: `0x${string}` }).id;
  }
  throw new Error('sendCallsAsync did not return a bundle id');
}

export default function Sell() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransactionAsync } = useSendTransaction();
  const { sendCallsAsync } = useSendCalls(); // ← async variant
  const { data: abstractClient } = useAbstractClient();

  const tokenMetadata = useTokenInfoStore((s) => s.tokenMetadata);
  const tokenAddress = useTokenInfoStore((s) => s.tokenAddress);
  const decimals = tokenMetadata?.decimals ?? 0;

  const slippagePct = useTradeSettingsStore((s) => s.slippagePct);

  function toBigIntOrUndefined(v: string | number | bigint | null | undefined): bigint | undefined {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'bigint') return v;
    return BigInt(v);
  }

  return (
    <TradeInterface
      tradeType="SELL"
      onSubmit={async (p) => {
        const amountInHuman: string = p.amount.toString();
        const slippage = Number.isFinite(slippagePct) ? slippagePct : 20;
        if (!address) throw new Error('Wallet not connected');
        if (!publicClient) throw new Error('No public client');
        if (!tokenAddress) throw new Error('Token address not resolved yet');

        try {
          const amountInAtomic = parseUnits(amountInHuman, Number(decimals));

          // Quote swap leg from backend (amount_in in base units)
          const payload: AbstractSwapRequest = {
            wallet_address: address,
            token_address: tokenAddress,
            amount_in: amountInAtomic.toString(),
            is_sell: true,
            slippage
          };

          const res: AxiosResponse<Partial<AbstractSwapResult>> = await axios.post(
            `${API_SWAP}/abs-swap-api/quote`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
          );

          const swap_tx: PreparedTx | undefined = res.data?.txs?.swap;
          if (!swap_tx) throw new Error('Swap transaction missing from API response.');

          // Build approval (spender = swap router address)
          const approveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [swap_tx.to, amountInAtomic]
          });

          const canBatch = !!abstractClient && typeof sendCallsAsync === 'function';

          if (canBatch) {
            const calls: Array<{ to: `0x${string}`; data: `0x${string}`; value?: bigint }> = [
              { to: tokenAddress as `0x${string}`, data: approveData as `0x${string}` },
              {
                to: swap_tx.to,
                data: swap_tx.input,
                value: toBigIntOrUndefined(swap_tx.value)
              }
            ];

            // Wait for wallet approval & submission (returns id / bundle hash)
            const sendResult = await sendCallsAsync({ calls });
            const bundleId = getBundleId(sendResult); // type: `0x${string}`

            showTxToast({
              kind: 'SELL',
              title: 'SELL Success!',
              hash: bundleId,
              explorerBase: defaultExplorerBase(),
              ttlMs: 10000
            });
            return;
          }

          // ---- Fallback: two normal txs (approve -> swap) ----
          const approveReceipt = await sendTransactionAsync({
            to: tokenAddress as `0x${string}`,
            data: approveData as `0x${string}`,
            value: BigInt(0)
          });

          showTxToast({
            kind: 'SELL',
            title: 'Approve TX submitted:',
            hash: JSON.stringify(approveReceipt),
            explorerBase: defaultExplorerBase(), // set via env or fallback
            ttlMs: 10000
          });

          const swapValue = toBigIntOrUndefined(swap_tx.value);

          const swapHash: Hash = await sendTransactionAsync({
            to: swap_tx.to as Address,
            data: swap_tx.input as Hex,
            value: swapValue // bigint | undefined
          });

          showTxToast({
            kind: 'SELL',
            title: 'Sell Success!',
            hash: swapHash,
            explorerBase: defaultExplorerBase(),
            ttlMs: 10000
          });
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
