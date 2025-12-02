import { formatUnits, parseUnits } from "ethers";

export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatCurrency(
  amount: bigint | string,
  decimals: number = 18,
  symbol: string = "AVAX"
): string {
  const formatted = formatUnits(amount, decimals);
  return `${parseFloat(formatted).toFixed(4)} ${symbol}`;
}

export function formatTrustScore(score: bigint | number): string {
  const numScore = typeof score === "bigint" ? Number(score) : score;
  return `${(numScore / 100).toFixed(2)}%`;
}

export function formatDate(timestamp: bigint | number): string {
  const date = new Date(
    typeof timestamp === "bigint" ? Number(timestamp) * 1000 : timestamp * 1000
  );
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

