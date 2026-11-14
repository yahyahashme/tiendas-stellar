import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLANK_MESSAGES, blankOf } from "./form-errors";

const root = join(__dirname, "..");
// Where the sign-up forms' messages are written.
const SOURCES = ["lib/server/accounts.ts", "lib/server/shops.ts", "lib/server/distributors.ts", "app/registro/distributor-form.tsx", "components/shop-signup.tsx"];
const code = SOURCES.map((path) => readFileSync(join(root, path), "utf8")).join("\n");

describe("blankOf", () => {
  it("puts a message under its blank", () => {
    expect(blankOf("El NIT debe tener 14 dígitos.")).toBe("nit");
    expect(blankOf("La contraseña debe tener al menos 8 caracteres.")).toBe("password");
    expect(blankOf("Elija qué vende.")).toBe("sells");
  });

  it("leaves a message about the whole form alone", () => {
    expect(blankOf(null)).toBeUndefined();
    expect(blankOf("Las cuentas todavía no están activas en este servidor.")).toBeUndefined();
    expect(blankOf("Teléfono, correo o contraseña incorrectos.")).toBeUndefined();
    expect(blankOf("Demasiados intentos. Espere unos minutos e intente de nuevo.")).toBeUndefined();
  });

  // If a message is reworded in the code, its line here goes stale and the message would move above the button.
  it.each(BLANK_MESSAGES)("still exists in the code: %s", (message) => {
    expect(code).toContain(`"${message}"`);
  });
});
