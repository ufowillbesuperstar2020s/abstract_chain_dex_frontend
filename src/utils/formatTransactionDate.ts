export default function formatTransactionDate(txDate: Date): string {
    const year = String(txDate.getFullYear()).slice(-2); // Get the last two digits of the year
    const month = String(txDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(txDate.getDate()).padStart(2, '0');
    const hours = String(txDate.getHours()).padStart(2, '0');
    const minutes = String(txDate.getMinutes()).padStart(2, '0');
    const seconds = String(txDate.getSeconds()).padStart(2, '0');

    return `${month}-${day}-${year} @ ${hours}:${minutes}:${seconds}`;
}