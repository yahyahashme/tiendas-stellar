// Makes an existing Relay user an admin, who can then approve distributors at /admin.
//
//   npm run make-admin -- your@email.com        (or a phone: 7123-4567)
import { neon } from "@neondatabase/serverless";
import { parseContact } from "../lib/server/accounts";

async function main() {
  const url = process.env.DATABASE_URL;
  const contact = parseContact(process.argv[2] ?? "");
  if (!url || !contact) {
    console.error("Usage: npm run make-admin -- <phone or email of an existing account>  (needs DATABASE_URL)");
    process.exit(1);
  }
  const sql = neon(url);
  const [column, value] = "phone" in contact ? ["phone", contact.phone] : ["email", contact.email];
  const rows = (await sql.query(`UPDATE users SET role = 'admin' WHERE ${column} = $1 RETURNING name`, [value])) as { name: string }[];
  console.log(rows[0] ? `${rows[0].name} is now a Relay admin.` : "No account with that phone or email. Sign up first.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
