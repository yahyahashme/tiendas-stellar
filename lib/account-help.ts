// The explainer screens behind Mi cuenta's money, security and help options (#127).
// They say how each one will work. None of it is built yet, and each screen says so.

export type HelpTopic =
  | "agregar"
  | "retirar"
  | "recibos"
  | "contrasena"
  | "llaves"
  | "dispositivos"
  | "contactos"
  | "ayuda"
  | "cerrar";

type Text = { title: string; intro: string; points: string[] };
export type Help = { es: Text; en: Text };

export const HELP: Record<HelpTopic, Help> = {
  agregar: {
    es: {
      title: "Agregar dinero",
      intro: "Usted cambia efectivo por dólares digitales, uno a uno, con un socio autorizado.",
      points: [
        "Entrega el efectivo en un punto de pago del socio (agente bancario o comercio de la red), o transfiere desde su banco.",
        "El socio pone los dólares digitales en su cuenta Relay, normalmente en minutos.",
        "Relay no cobra a las tiendas por agregar dinero.",
      ],
    },
    en: {
      title: "Add money",
      intro: "You swap cash for digital dollars, one for one, with a licensed partner.",
      points: [
        "You hand the cash in at one of the partner's payment points (a banking agent or a shop in its network), or send a transfer from your bank.",
        "The partner puts the digital dollars in your Relay account, usually within minutes.",
        "Relay doesn't charge shops to add money.",
      ],
    },
  },
  retirar: {
    es: {
      title: "Retirar",
      intro: "Usted cambia dólares digitales por efectivo o los manda a su banco, con el mismo socio.",
      points: [
        "Elige el monto y a dónde va: su cuenta de banco o efectivo en un punto de pago.",
        "Llega el mismo día.",
        "Si entró desde un teléfono nuevo, el dinero no puede salir durante 1 o 2 días, para protegerlo.",
      ],
    },
    en: {
      title: "Withdraw",
      intro: "You swap digital dollars for cash or send them to your bank, with the same partner.",
      points: [
        "You pick the amount and where it goes: your bank account or cash at a payment point.",
        "It arrives the same day.",
        "If you signed in from a new phone, money can't leave for 1 or 2 days, to protect you.",
      ],
    },
  },
  recibos: {
    es: {
      title: "Recibos",
      intro: "Cada pago deja un recibo que puede ver y compartir.",
      points: [
        "Fecha, factura, monto, cómo pagó y qué motorista lo atendió.",
        "«Compartir por WhatsApp» manda el recibo a quien usted quiera.",
        "«Ver detalles» muestra el registro público del pago.",
      ],
    },
    en: {
      title: "Receipts",
      intro: "Every payment leaves a receipt you can see and share.",
      points: [
        "Date, invoice, amount, how you paid, and which driver served you.",
        "“Share on WhatsApp” sends the receipt to anyone you choose.",
        "“See details” shows the payment's public record.",
      ],
    },
  },
  contrasena: {
    es: {
      title: "Cambiar contraseña",
      intro: "Cada día entra con su huella o su cara. La contraseña (o PIN) es su respaldo.",
      points: [
        "Si no tiene su teléfono, entra con la contraseña y UNA de estas: un código a su número, el visto bueno de un contacto de confianza, o una revisión de identidad (selfie con su DUI, o en persona con el socio).",
        "Para cambiar la contraseña, primero confirma con su huella o con uno de esos respaldos.",
        "Si olvidó la contraseña, la revisión de identidad le permite poner una nueva.",
      ],
    },
    en: {
      title: "Change password",
      intro: "Every day you sign in with your fingerprint or face. The password (or PIN) is your backup.",
      points: [
        "Without your phone, you sign in with the password plus ONE of these: a code to your number, an OK from a trusted contact, or an ID check (a selfie with your DUI, or in person with the partner).",
        "To change the password, you first confirm with your fingerprint or one of those backups.",
        "If you forgot the password, the ID check lets you set a new one.",
      ],
    },
  },
  llaves: {
    es: {
      title: "Llaves de acceso",
      intro: "Una llave de acceso es su huella o su cara en un teléfono. Es la forma más segura de entrar.",
      points: [
        "Puede tener una llave en cada teléfono que use (por ejemplo, el suyo y el de la tienda).",
        "Nadie puede copiarla: se queda en el teléfono.",
        "Si pierde un teléfono, quita su llave desde aquí o desde otro teléfono.",
      ],
    },
    en: {
      title: "Passkeys",
      intro: "A passkey is your fingerprint or face on a phone. It's the safest way to sign in.",
      points: [
        "You can have one on each phone you use (for example, yours and the shop's).",
        "Nobody can copy it: it stays on the phone.",
        "If you lose a phone, remove its passkey here or from another phone.",
      ],
    },
  },
  dispositivos: {
    es: {
      title: "Dispositivos",
      intro: "La lista de teléfonos y computadoras donde su cuenta está abierta.",
      points: [
        "Ve cuándo se usó cada uno por última vez, y puede cerrar la sesión en cualquiera.",
        "Cuando entra un dispositivo nuevo, el dinero no puede salir de la cuenta durante 1 o 2 días. Si no fue usted, ciérrelo y nada se pierde.",
        "Le avisamos por WhatsApp cada vez que entra un dispositivo nuevo.",
      ],
    },
    en: {
      title: "Devices",
      intro: "The list of phones and computers where your account is open.",
      points: [
        "You see when each was last used, and can sign any of them out.",
        "When a new device signs in, money can't leave the account for 1 or 2 days. If it wasn't you, sign it out and nothing is lost.",
        "We tell you on WhatsApp every time a new device signs in.",
      ],
    },
  },
  contactos: {
    es: {
      title: "Contactos de confianza",
      intro: "Usted elige de 1 a 3 personas (familia o amigos) que pueden ayudar si no puede entrar, o si fallece.",
      points: [
        "Si usted no puede entrar, uno de ellos puede dar el visto bueno para que vuelva a entrar con su contraseña.",
        "Si usted fallece o no puede atender la tienda, la mayoría de ellos lo pide. El socio revisa sus identidades (y el acta de defunción si hace falta).",
        "Luego hay unos 7 días de espera. Si usted está bien, lo cancela con un toque y no pasa nada.",
        "Después, la persona que sigue con la tienda abre su propia cuenta Relay. El saldo pasa a esa cuenta, menos el crédito que se deba, que primero le paga al fondo de préstamos. La cuenta anterior se cierra.",
      ],
    },
    en: {
      title: "Trusted contacts",
      intro: "You pick 1 to 3 people (family or friends) who can help if you can't get in, or if you die.",
      points: [
        "If you can't get in, one of them can give the OK for you to sign back in with your password.",
        "If you die or can't run the shop, most of them ask for it. The partner checks their IDs (and a death certificate if needed).",
        "Then there is a wait of about 7 days. If you're fine, you cancel it with one tap and nothing happens.",
        "After that, the person who takes over the shop opens their own Relay account. The balance moves there, minus any credit still owed, which pays the lender pool first. The old account is closed.",
      ],
    },
  },
  ayuda: {
    es: {
      title: "Ayuda",
      intro: "Hable con una persona, no con un menú.",
      points: [
        "Escríbanos por WhatsApp de 7 a. m. a 7 p. m., todos los días.",
        "Su motorista también puede ayudarle en la próxima entrega.",
        "Si un cobro no es correcto, toque «Reportar un error» en el recibo: se abre WhatsApp con el recibo listo para enviar a su distribuidor.",
      ],
    },
    en: {
      title: "Help",
      intro: "Talk to a person, not a menu.",
      points: [
        "Message us on WhatsApp from 7 a.m. to 7 p.m., every day.",
        "Your driver can also help at the next delivery.",
        "If a charge isn't right, tap “Report a mistake” on the receipt: WhatsApp opens with the receipt ready to send to your distributor.",
      ],
    },
  },
  cerrar: {
    es: {
      title: "Cerrar cuenta",
      intro: "Puede cerrar su cuenta cuando quiera.",
      points: [
        "Primero paga el crédito que deba.",
        "Luego retira su saldo a su banco o en efectivo.",
        "Avisamos a sus distribuidores. Guardamos el historial de pagos el tiempo que pide la ley, y nada más.",
      ],
    },
    en: {
      title: "Close account",
      intro: "You can close your account whenever you want.",
      points: [
        "First you pay any credit you owe.",
        "Then you withdraw your balance to your bank or in cash.",
        "We tell your distributors. We keep the payment history as long as the law requires, and nothing more.",
      ],
    },
  },
};

export const isHelpTopic = (topic: string): topic is HelpTopic => Object.hasOwn(HELP, topic);
