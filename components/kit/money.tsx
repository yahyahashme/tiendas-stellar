import { formatMoney } from "@/lib/format";

/**
 * An amount, always in IBM Plex Mono: "$ 48.50", a thin gap after the sign, two decimals, tabular.
 * Size, weight and colour come from `className`. For plain text (hints, aria labels) use formatAmount().
 */
export function Money({ value, className = "" }: { value: number; className?: string }) {
  const digits = formatMoney(Math.abs(value)).slice(1);
  return (
    <span className={`money ${className}`}>
      {value < 0 && "−"}
      <span className="money-sign">$</span>
      {digits}
    </span>
  );
}

/** How many characters wide an amount is ("$ 1,234.50" = 10), for figures that shrink to fit. */
export function moneyWidth(value: number): number {
  return formatMoney(value).length + 1;
}

/**
 * A sentence from the server with its amounts set like every other amount: "Pago recibido: $ 48.50 en dólares digitales."
 * The words may be green or red; the amounts stay ink, the strongest contrast on the screen.
 */
export function MoneyText({ children }: { children: string }) {
  const parts = children.split(/(\$\d[\d,]*\.\d{2})/);
  return parts.map((part, i) => (i % 2 ? <Money key={i} value={Number(part.slice(1).replaceAll(",", ""))} className="text-ink" /> : part));
}
