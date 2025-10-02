export interface TokenMetadata {
    name: string,
    symbol: string,
    decimals: number,
    address: string
}

export interface Transaction {
    to: `0x${string}`,
    value?:`0x${string}`,
    input:`0x${string}`,
    nonce?:`0x${string}`
}

export interface AbstractSwapResult {
    txs: {
        approve?: Transaction,
        swap: Transaction
    }
}