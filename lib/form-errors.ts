// Which blank a message is about, so a form can show it in words under that blank.
// The messages are the fixed ones the sign-up checks send (lib/server/accounts.ts, shops.ts,
// distributors.ts and the forms' own checks). A message that isn't here is about the whole form
// and goes above its button, so a reworded or new message is never lost: it only moves there.

export type Blank = "name" | "contact" | "password" | "shopName" | "businessName" | "nit" | "address" | "kind" | "sells" | "approx";

const BLANK: Record<string, Blank> = {
  "Escriba su nombre.": "name",
  "Escriba un teléfono de El Salvador (8 dígitos).": "contact",
  "Escriba un teléfono de El Salvador (8 dígitos) o un correo válido.": "contact",
  "Ya hay una cuenta con ese teléfono o correo. Entre con su contraseña.": "contact",
  "La contraseña debe tener al menos 8 caracteres.": "password",
  "Esa contraseña es muy fácil de adivinar. Use otra.": "password",
  "Escriba el nombre de su tienda.": "shopName",
  "Elija qué tipo de tienda es.": "kind",
  "La dirección es muy larga.": "address",
  "Escriba el nombre de la empresa.": "businessName",
  "El NIT debe tener 14 dígitos.": "nit",
  "Escriba la dirección de la empresa.": "address",
  "Elija qué vende.": "sells",
  "Escriba un número aproximado.": "approx",
};

/** The blank this message is about, or undefined when it is about the whole form. */
export function blankOf(message: string | null): Blank | undefined {
  return message === null ? undefined : BLANK[message];
}

/** Every message that has a blank, for the test that keeps this list true to the code. */
export const BLANK_MESSAGES = Object.keys(BLANK);
