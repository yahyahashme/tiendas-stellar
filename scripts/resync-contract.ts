// After a new route_ledger deploy (scripts/deploy.sh), the contract only knows
// the demo accounts. This gives it back what the accounts database says:
// approved distributors get approve_distributor, and shops with an owner that
// never used credit get the $200 starting limit (set_terms).
// It reads the contract in config/testnet.json, and the admin key from
// STELLAR_SECRET_ADMIN (.env.local), like the app. It never prints a key.
//
//   npm run resync-contract              shows what it would do
//   npm run resync-contract -- --apply   does it
import { requireDb } from "../lib/server/db";
import { readClient } from "../lib/stellar/client";
import { config } from "../lib/stellar/config";
import { read, run } from "../lib/stellar/send";

const STARTING_LIMIT = 2_000_000_000n; // $200, 7 decimals
const apply = process.argv.includes("--apply");

async function main() {
  const db = requireDb();
  console.log(`Contract ${config.contracts.routeLedger}${apply ? "" : " (dry run: add --apply to send)"}`);

  const distributors = await db.query<{ business_name: string; stellar_address: string }>(
    `SELECT business_name, stellar_address FROM distributors WHERE status = 'aprobado' AND id <> 'distributor'`,
  );
  for (const d of distributors) {
    if (await read(readClient().is_distributor({ distributor: d.stellar_address }))) continue;
    console.log(`approve_distributor  ${d.business_name}`);
    if (apply) await run("admin", (client) => client.approve_distributor({ distributor: d.stellar_address }));
  }

  const shops = await db.query<{ name: string; stellar_address: string }>(
    `SELECT name, stellar_address FROM shops WHERE owner_user_id IS NOT NULL`,
  );
  for (const s of shops) {
    const view = await read(readClient().get_shop({ shop: s.stellar_address }));
    // Only shops that never used credit: a limit can fall to $0 after late payments
    // or a default, and this must not undo that.
    if (view.limit > 0n || view.owed > 0n || view.on_time > 0 || view.late > 0) continue;
    console.log(`set_terms $200       ${s.name}`);
    if (apply) await run("admin", (client) => client.set_terms({ shop: s.stellar_address, limit: STARTING_LIMIT }));
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
