'use client';

import TradeInterface from '../shared/TradeInterface';
import type { AbstractSwapResult } from '@/types/api';
import axios, { AxiosResponse } from 'axios';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useTradeSettingsStore } from '@/app/stores/tradeSettings-store';
import { useTokenInfoStore } from '@/app/stores/tokenInfo-store';

type AbstractSwapRequest = {
  wallet_address: string;
  token_address: string;
  amount_in: string;
  is_sell: boolean;
  slippage: number;
};

const API_SWAP = process.env.NEXT_PUBLIC_API_SWAP ?? '';

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
          const res: AxiosResponse<Partial<AbstractSwapResult>> = await axios.post(
            `${API_SWAP}/abs-swap-api/quote`,
            payload,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );

          const swap_tx = res.data.txs?.swap;

          if (swap_tx) {
            const tx = swap_tx.input;
            const value = BigInt(swap_tx.value ?? 0);
            const to = swap_tx.to;
            const receipt = await sendTransactionAsync({
              to: to,
              value: value,
              data: tx
            });
            showReceiptAlert(receipt);
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

// Simple alert with receipt value and copy button
function showReceiptAlert(receipt: string) {
  const value = typeof receipt === 'string' ? receipt : JSON.stringify(receipt);

  // Create alert container
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

  // Receipt text
  const text = document.createElement('span');
  text.innerText = value;
  container.appendChild(text);

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.innerText = 'Copy';
  copyBtn.style.marginLeft = '10px';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(value);
    copyBtn.innerText = 'Copied!';
    setTimeout(() => (copyBtn.innerText = 'Copy'), 1500);
  };
  container.appendChild(copyBtn);

  // Close button
  const closeBtn = document.createElement('span');
  closeBtn.innerText = '✕';
  closeBtn.style.marginLeft = '10px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => container.remove();
  container.appendChild(closeBtn);

  // Add to DOM
  document.body.appendChild(container);
}
