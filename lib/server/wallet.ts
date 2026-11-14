import "server-only";

import { Asset, Keypair, Operation, TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import { config } from "@/lib/stellar/config";
import { submitSigned } from "@/lib/stellar/send";
import { encryptSecret } from "./crypto";

const FRIENDBOT = "https://friendbot.stellar.org";

export type NewWallet = { address: string; secretEnc: string };

/** The network steps, swappable in tests (testnet is only reachable from Vercel or Yahya's Mac). */
export type WalletNetwork = {
  fund(address: string): Promise<void>;
  addUsdcTrustline(keypair: Keypair): Promise<void>;
};

export const testnet: WalletNetwork = {
  async fund(address) {
    const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(address)}`);
    // 400 with "already funded" is fine on a retry.
    if (!res.ok && !(await res.text()).includes("createAccountAlreadyExist")) {
      throw new Error(`friendbot ${res.status}`);
    }
  },
  async addUsdcTrustline(keypair) {
    const server = new rpc.Server(config.rpcUrl);
    const account = await server.getAccount(keypair.publicKey());
    const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: config.networkPassphrase })
      .addOperation(Operation.changeTrust({ asset: new Asset(config.token.code, config.token.issuer) }))
      .setTimeout(60)
      .build();
    tx.sign(keypair);
    await submitSigned(tx); // sponsored, like every other transaction (#33)
  },
};

/**
 * A new testnet account for a new user or shop: a fresh keypair, funded by
 * friendbot, with the test-USDC trustline. The secret comes back encrypted
 * with WALLET_KEY and is never logged or sent to the browser.
 */
export async function createWallet(network: WalletNetwork = testnet): Promise<NewWallet> {
  const keypair = Keypair.random();
  const secretEnc = encryptSecret(keypair.secret()); // fail early if WALLET_KEY is missing
  await network.fund(keypair.publicKey());
  await network.addUsdcTrustline(keypair);
  return { address: keypair.publicKey(), secretEnc };
}
