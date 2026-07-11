/** 28550000 -> "$ 285.500" (COP, thousands separated by dots, no decimals). */
export function formatCop(amountInCents: number): string {
  const pesos = Math.round(amountInCents / 100);
  const formatted = pesos
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${formatted}`;
}
