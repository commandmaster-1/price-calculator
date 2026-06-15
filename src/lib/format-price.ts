export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(euros);
}

export function parsePriceInput(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;

  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return null;

  return Math.round(parsed * 100);
}

export function formatPriceInput(cents: number): string {
  const euros = cents / 100;
  return euros.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}