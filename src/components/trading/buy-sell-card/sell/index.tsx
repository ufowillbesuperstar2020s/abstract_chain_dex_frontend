'use client';

import TradeInterface from '../shared/TradeInterface';
import type { AbstractSwapResult } from '@/types/api';
import axios, { AxiosResponse } from 'axios';

import { useAccount, useSendTransaction, useSendCalls, usePublicClient } from 'wagmi';
import { useAbstractClient } from '@abstract-foundation/agw-react';
import { parseUnits, encodeFunctionData } from 'viem';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';

const API_SWAP = process.env.NEXT_PUBLIC_API_SWAP ?? 'https://server23.looter.ai/evm-chart-api/';

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
        const slippage = 50; // wang_tmp

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
            const sendResult = (await sendCallsAsync({ calls })) as unknown;
            const bundleId = getBundleId(sendResult);
            showInfoAlert(bundleId);
            return;
          }

          // ---- Fallback: two normal txs (approve -> swap) ----
          const approveReceipt = await sendTransactionAsync({
            to: tokenAddress as `0x${string}`,
            data: approveData as `0x${string}`,
            value: BigInt(0)
          });
          showInfoAlert(`Approve TX submitted:\n${JSON.stringify(approveReceipt)}`);

          const swapValue = toBigIntOrUndefined(swap_tx.value);

          const swapReceipt = await sendTransactionAsync({
            to: swap_tx.to,
            data: swap_tx.input,
            value: swapValue
          });

          showReceiptAlert(swapReceipt);
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

// ----- UI helpers -----
function showReceiptAlert(receipt: string) {
  const value = JSON.stringify(receipt, null, 2);
  showAlert(value);
}
function showInfoAlert(message: string) {
  showAlert(message);
}
function showAlert(value: string) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.padding = '12px';
  container.style.background = 'white';
  container.style.border = '1px solid #ccc';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  container.style.zIndex = '9999';
  container.style.fontFamily = 'monospace';
  container.style.maxWidth = '520px';
  container.style.whiteSpace = 'pre-wrap';

  const text = document.createElement('span');
  text.innerText = value;
  container.appendChild(text);

  const copyBtn = document.createElement('button');
  copyBtn.innerText = 'Copy';
  copyBtn.style.marginLeft = '10px';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(value);
    copyBtn.innerText = 'Copied!';
    setTimeout(() => (copyBtn.innerText = 'Copy'), 1500);
  };
  container.appendChild(copyBtn);

  const closeBtn = document.createElement('span');
  closeBtn.innerText = '✕';
  closeBtn.style.marginLeft = '10px';
  closeBtn.style.cursor = 'pointer';
  const remove = () => container.remove();
  closeBtn.onclick = remove;
  container.appendChild(closeBtn);

  document.body.appendChild(container);
}
