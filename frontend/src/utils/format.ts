// Currency formatting ported from configurator.js (de-DE locale, no decimals).
export function formatEuro(value: number): string {
  return "€" + value.toLocaleString("de-DE", { minimumFractionDigits: 0 });
}
