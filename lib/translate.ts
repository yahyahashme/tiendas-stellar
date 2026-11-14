// English for the messages the server, the mock and the contract send back. They are
// always written in Spanish (lib/stellar/errors.ts, app/actions.ts, lib/mock.ts,
// lib/csv.ts, lib/labels.ts), so the screens translate them here when English is on.
// lib/translate.test.ts runs every one of them through this list.

const MONEY = String.raw`(\$[\d,]+\.\d{2})`;
const DATE = String.raw`(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)`;
const NUM = String.raw`(\d+)`;
const MONEY_PLAIN = String.raw`(\$[\d,]+)`;

const MONTH_EN: Record<string, string> = {
  ene: "Jan", feb: "Feb", mar: "Mar", abr: "Apr", may: "May", jun: "Jun",
  jul: "Jul", ago: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dic: "Dec",
};

/** "17 nov" -> "Nov 17" */
export function englishDay(day: string, month: string): string {
  return `${MONTH_EN[month] ?? month} ${day}`;
}

type Rule = [RegExp, string | ((...groups: string[]) => string)];

const exact = (es: string, en: string): Rule => [new RegExp(`^${es.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), en];
const pattern = (es: string, en: Rule[1]): Rule => [new RegExp(`^${es}$`), en];

const RULES: Rule[] = [
  // Payments
  pattern(String.raw`Pago recibido: ${MONEY} en dólares digitales\.`, "Payment received: $1 in digital dollars."),
  pattern(String.raw`Pago recibido: ${MONEY}\. Falta ${MONEY}\.`, "Payment received: $1. $2 left to pay."),
  pattern(String.raw`Listo\. Tiene hasta el ${DATE} para pagar ${MONEY}, sin intereses\.`, (_, d, m, money) =>
    `Done. You have until ${englishDay(d, m)} to pay ${money}, with no interest.`),
  exact("Listo. Ahora la tienda debe tocar «Confirmo».", "Done. Now the shop has to tap “Confirm”."),
  pattern(String.raw`Listo\. Confirmó ${MONEY} en efectivo\.`, "Done. You confirmed $1 in cash."),
  pattern(String.raw`Listo\. (.+) entregó ${MONEY} en efectivo\.`, "Done. $1 handed in $2 in cash."),
  pattern(String.raw`Deuda pagada con atraso\. Su límite bajó a ${MONEY}\.`, "Debt paid late. Your limit went down to $1."),
  exact("Deuda pagada con atraso.", "Debt paid late."),
  pattern(String.raw`Deuda pagada a tiempo\. Su límite subió a ${MONEY}\.`, "Debt paid on time. Your limit went up to $1."),
  exact("Deuda pagada a tiempo. Gracias.", "Debt paid on time. Thank you."),
  pattern(String.raw`El monto es mayor que lo que falta pagar \(${MONEY}\)\.`, "The amount is more than what's left to pay ($1)."),
  exact("El monto es mayor que lo que falta pagar.", "The amount is more than what's left to pay."),
  pattern(String.raw`Hay ${MONEY} en efectivo por confirmar\. Puede pagar hasta ${MONEY}\.`,
    "$1 in cash is waiting to be confirmed. You can pay up to $2."),
  exact("El efectivo registrado es mayor que lo que falta pagar.", "The cash registered is more than what's left to pay."),

  // CSV import
  exact("Listo. Se creó 1 factura.", "Done. 1 invoice created."),
  pattern(String.raw`Listo\. Se crearon ${NUM} facturas\.`, "Done. $1 invoices created."),
  exact("Se creó 1 factura.", "1 invoice created."),
  pattern(String.raw`Se crearon ${NUM} facturas\.`, "$1 invoices created."),
  pattern(String.raw`Se crearon ${NUM} de ${NUM} facturas\. (.+)`, (_, done, all, rest) =>
    `${done} of ${all} invoices created. ${translateMessage(rest)}`),
  exact("No hay facturas para crear.", "There are no invoices to create."),
  pattern(String.raw`Máximo ${NUM} facturas por archivo\.`, "At most $1 invoices per file."),
  pattern(String.raw`Fila ${NUM}: tienda desconocida\.`, "Row $1: unknown shop."),
  pattern(String.raw`Fila ${NUM}: motorista desconocido\.`, "Row $1: unknown driver."),
  pattern(String.raw`Fila ${NUM}: número de factura inválido\.`, "Row $1: invalid invoice number."),
  pattern(String.raw`Fila ${NUM}: la factura ${NUM} está repetida\.`, "Row $1: invoice $2 appears twice."),
  pattern(String.raw`Fila ${NUM}: la factura ${NUM} ya existe\.`, "Row $1: invoice $2 already exists."),
  pattern(String.raw`Fila ${NUM}: monto inválido\.`, "Row $1: invalid amount."),
  pattern(String.raw`Fila ${NUM}: fecha inválida\.`, "Row $1: invalid date."),
  pattern(String.raw`Encabezado inválido\. Use: (.+)`, "Invalid header. Use: $1"),
  exact("La fila debe tener 5 columnas", "The row must have 5 columns"),
  exact("Falta el número de factura", "Missing invoice number"),
  pattern(String.raw`Número de factura inválido: (.*)`, "Invalid invoice number: $1"),
  pattern(String.raw`Factura repetida: (.*)`, "Invoice appears twice: $1"),
  exact("Falta la tienda", "Missing shop"),
  pattern(String.raw`Tienda desconocida: (.*)`, "Unknown shop: $1"),
  exact("Falta el motorista", "Missing driver"),
  pattern(String.raw`Motorista desconocido: (.*)`, "Unknown driver: $1"),
  exact("Falta el monto", "Missing amount"),
  pattern(String.raw`Monto inválido: (.*)`, "Invalid amount: $1"),
  exact("El monto debe ser mayor que 0", "The amount must be more than 0"),
  exact("Falta la fecha", "Missing date"),
  exact("Fecha inválida (use AAAA-MM-DD)", "Invalid date (use YYYY-MM-DD)"),
  exact("El archivo no tiene facturas", "The file has no invoices"),

  // Refusals (the contract's codes, lib/stellar/errors.ts, and the same checks in the mock)
  exact("Esa factura ya existe.", "That invoice already exists."),
  exact("No encontramos esa factura.", "We couldn't find that invoice."),
  exact("Monto inválido.", "Invalid amount."),
  exact("El monto es mayor que lo pendiente.", "The amount is more than what's left to pay."),
  exact("Esta factura ya está pagada.", "This invoice is already paid."),
  exact("Esta factura no es de su tienda.", "This invoice isn't for your shop."),
  exact("Tiene un pago vencido. Pague su deuda para volver a usar crédito.", "You have an overdue payment. Pay your debt to use credit again."),
  exact("Tiene un pago vencido.", "You have an overdue payment."),
  exact("Esta compra supera su límite de crédito.", "This purchase is over your credit limit."),
  exact("Supera su límite de crédito.", "It's over your credit limit."),
  exact("El crédito no está disponible en este momento.", "Credit isn't available right now."),
  exact("Hoy no hay fondos para crédito. Intente más tarde.", "There's no credit money available today. Try again later."),
  exact("No tiene deuda pendiente.", "You have no debt to pay."),
  exact("No tiene deudas pendientes.", "You have no debts to pay."),
  exact("El motorista aún no registró el efectivo.", "The driver hasn't registered the cash yet."),
  exact("Su tienda aún no tiene crédito.", "Your shop doesn't have credit yet."),
  exact("Esta tienda todavía no tiene crédito.", "This shop doesn't have credit yet."),
  exact("El motorista cambió el monto. Revise el nuevo monto y confirme de nuevo.", "The driver changed the amount. Check the new amount and confirm again."),
  exact("Este motorista no está en la ruta.", "This driver isn't on the route."),
  exact("No encontramos esa tienda.", "We couldn't find that shop."),
  exact("No encontramos a ese motorista.", "We couldn't find that driver."),
  exact("Tienda desconocida.", "Unknown shop."),
  exact("No se pudo completar. Intente de nuevo.", "Couldn't complete it. Please try again."),
  exact("Algo salió mal. Intente de nuevo.", "Something went wrong. Please try again."),
  exact("Todavía no está conectado al contrato.", "Not connected to the contract yet."),

  // Accounts (#129)
  exact("Escriba su nombre.", "Enter your name."),
  exact("Escriba un teléfono de El Salvador (8 dígitos) o un correo válido.", "Enter a Salvadoran phone number (8 digits) or a valid email."),
  exact("La contraseña debe tener al menos 8 caracteres.", "The password must be at least 8 characters."),
  exact("Las cuentas todavía no están activas en este servidor.", "Accounts aren't switched on on this server yet."),
  exact("Los motoristas se registran con la invitación de su distribuidora.", "Drivers sign up with their distributor's invite."),
  exact("No pudimos crear su cuenta en este momento. Intente de nuevo en un minuto.", "We couldn't create your account right now. Try again in a minute."),
  exact("Teléfono, correo o contraseña incorrectos.", "Wrong phone, email or password."),
  exact("Ya hay una cuenta con ese teléfono o correo. Entre con su contraseña.", "There's already an account with that phone or email. Sign in with your password."),

  // Distributors (#130)
  exact("El NIT debe tener 14 dígitos.", "The tax ID (NIT) must have 14 digits."),
  exact("Elija qué vende.", "Choose what you sell."),
  exact("Escriba el nombre de la empresa.", "Enter the business name."),
  exact("Escriba la dirección de la empresa.", "Enter the business address."),
  exact("Escriba un número aproximado.", "Enter an approximate number."),
  exact("Solo para administradores de Relay.", "Relay administrators only."),

  // Drivers (#131)
  exact("Escriba el nombre del motorista.", "Enter the driver's name."),
  exact("Escriba un teléfono de El Salvador (8 dígitos).", "Enter a Salvadoran phone number (8 digits)."),
  exact("Esta invitación ya no es válida. Pida otra a su distribuidora.", "This invite is no longer valid. Ask your distributor for a new one."),
  exact("Esta invitación ya se usó. Entre con su contraseña.", "This invite was already used. Sign in with your password."),
  exact("Ya invitó a ese teléfono. Comparta el mismo enlace.", "You already invited that phone. Share the same link."),

  // Drivers (#131), more
  exact("Solo la distribuidora aprobada puede hacer esto.", "Only the approved distributor can do this."),

  // Shops (#132)
  exact("Entre a su cuenta primero.", "Sign in to your account first."),
  exact("Escriba el nombre de su tienda.", "Write your shop's name."),
  exact("Escriba un nombre para reconocer la tienda.", "Write a name to recognize the shop."),
  exact("Escriba un teléfono de El Salvador (8 dígitos) o déjelo vacío.", "Write a Salvadoran phone number (8 digits) or leave it empty."),
  exact("Este código ya no es válido. Pida otro a su distribuidora.", "This code is no longer valid. Ask your distributor for another one."),

  // New invoices (#133)
  pattern(String.raw`Factura ${NUM} creada\.`, "Invoice $1 created."),
  pattern(String.raw`El número ${NUM} ya está usado\. Use otro\.`, "Number $1 is already used. Use another one."),
  exact("Su distribuidora todavía no está aprobada para crear facturas.", "Your distributor isn't approved to create invoices yet."),
  exact("Escriba un número de factura (solo números).", "Enter an invoice number (numbers only)."),
  exact("Elija una de sus tiendas.", "Choose one of your shops."),
  exact("Elija uno de sus motoristas.", "Choose one of your drivers."),
  pattern(String.raw`Escriba un monto mayor que \$0 y hasta ${MONEY_PLAIN}\.`, "Enter an amount over $$0 and up to $1."),
  exact("Elija la fecha en que vence.", "Choose the due date."),
  exact("La fecha de vencimiento ya pasó.", "The due date has already passed."),
  pattern(String.raw`La nota puede tener hasta ${NUM} letras\.`, "The note can have up to $1 characters."),
  pattern(String.raw`Hay dos tiendas con ese nombre: (.*)`, "Two shops have that name: $1"),
  pattern(String.raw`Hay dos motoristas con ese nombre: (.*)`, "Two drivers have that name: $1"),

  // Shop sign-up (#134)
  exact("La dirección es muy larga.", "The address is too long."),
  exact("Elija qué tipo de tienda es.", "Choose what kind of shop it is."),
  exact("Puede agregar hasta 3 contactos.", "You can add up to 3 contacts."),
  exact("Escriba el nombre de cada contacto.", "Enter each contact's name."),
  exact("Escriba un teléfono de El Salvador (8 dígitos) para cada contacto.", "Enter a Salvadoran phone number (8 digits) for each contact."),
  exact("Un contacto de confianza no puede ser su propio teléfono.", "A trusted contact can't be your own phone."),
  // Who may act, and rate limits (Jack's review of #145)
  exact("Entre a su cuenta para hacer esto. Solo el dueño de la cuenta puede.", "Sign in to do this. Only the account's owner can."),
  exact("Demasiados intentos. Espere unos minutos e intente de nuevo.", "Too many tries. Wait a few minutes and try again."),
  exact("Esa contraseña es muy fácil de adivinar. Use otra.", "That password is too easy to guess. Use another one."),

  // A CSV row with one of the form's messages (#149): the specific "Fila N: ..." rules above win.
  pattern(String.raw`Fila ${NUM}: (.+)`, (_, row, rest) => `Row ${row}: ${translateMessage(rest)}`),

  // Mi cuenta → Datos (#127)
  exact("Datos guardados.", "Details saved."),
  exact("Escriba el nombre de la tienda.", "Type the shop's name."),
  exact("Revise el teléfono.", "Check the phone number."),
  exact("Revise el DUI (9 números).", "Check the DUI (9 digits)."),
];

/**
 * The English for a Spanish message from the server, the mock or the contract.
 * Anything not in the list comes back unchanged (lib/translate.test.ts keeps the list complete).
 */
export function translateMessage(text: string): string {
  const trimmed = text.trim();
  for (const [regex, english] of RULES) {
    const match = regex.exec(trimmed);
    if (!match) continue;
    return typeof english === "string" ? trimmed.replace(regex, english) : english(...match);
  }
  return text;
}
