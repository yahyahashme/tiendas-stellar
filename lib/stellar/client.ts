import "server-only";

import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { Client } from "@/packages/route_ledger/src/index";
import { getDirectory, keypairForId } from "@/lib/server/directory";
import { config } from "./config";

const base = () => ({
  contractId: config.contracts.routeLedger,
  rpcUrl: config.rpcUrl,
  networkPassphrase: config.networkPassphrase,
});

let reader: Client | undefined;

/** For reads: simulate only, never sign. Any funded account works as the source. */
export function readClient(): Client {
  return (reader ??= new Client({ ...base(), publicKey: config.accounts.admin }));
}

const signers = new Map<string, Promise<Client>>();

/**
 * For writes: builds, simulates and signs as the account with this id: a demo
 * role ("distributor", "tienda-1", "admin") or an account created by sign-up.
 */
export function clientFor(id: string): Promise<Client> {
  let client = signers.get(id);
  if (!client) {
    client = (async () => {
      const keypair = await keypairForId(id);
      const party = (await getDirectory()).byId(id);
      return new Client({
        ...base(),
        publicKey: party?.address ?? keypair.publicKey(),
        ...basicNodeSigner(keypair, config.networkPassphrase),
      });
    })();
    client.catch(() => signers.delete(id)); // a missing key isn't cached
    signers.set(id, client);
  }
  return client;
}
