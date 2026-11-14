import "server-only";

// Contract error code -> what the screens say (same numbers as
// contracts/route_ledger/src/lib.rs `enum Error`).
const MESSAGES: Record<number, string> = {
  1: "Esa factura ya existe.",
  2: "No encontramos esa factura.",
  3: "Monto inválido.",
  4: "El monto es mayor que lo pendiente.",
  5: "Esta factura ya está pagada.",
  6: "Esta factura no es de su tienda.",
  7: "Tiene un pago vencido. Pague su deuda para volver a usar crédito.",
  8: "Esta compra supera su límite de crédito.",
  9: "El crédito no está disponible en este momento.",
  10: "No tiene deuda pendiente.",
  11: "El motorista aún no registró el efectivo.",
  12: "Su tienda aún no tiene crédito.",
  13: "Su distribuidora todavía no está aprobada para crear facturas.",
  15: "El motorista cambió el monto. Revise el nuevo monto y confirme de nuevo.",
};

export const FALLBACK_MESSAGE = "No se pudo completar. Intente de nuevo.";

/** The contract's error number inside an SDK error text, e.g. "Error(Contract, #4)". */
export function contractErrorCode(text: string): number | null {
  const match = /Error\(Contract, #(\d+)\)/.exec(text);
  return match ? Number(match[1]) : null;
}

export function errorMessage(code: number | null): string {
  return (code !== null && MESSAGES[code]) || FALLBACK_MESSAGE;
}

/** A contract said no: carries the Spanish message for the receipt. */
export class ContractError extends Error {
  constructor(public readonly code: number | null) {
    super(errorMessage(code));
  }
}
