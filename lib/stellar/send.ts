import "server-only";

import { rpc, type Transaction } from "@stellar/stellar-sdk";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import type { Client } from "@/packages/route_ledger/src/index";
import { clientFor } from "./client";
import { config } from "./config";
import { ContractError, contractErrorCode } from "./errors";
import { canSponsor, describeResult, innerResultCode, sponsorFeeBump } from "./sponsor";

const server = new rpc.Server(config.rpcUrl);
const MAX_RETRIES = 6;
const POLL_MS = 1000;
const POLL_TRIES = 30;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The sequence number was already used (another call from the same account won). */
class BadSequence extends Error {
  constructor() {
    super("Sequence number already used (another call from the same account won)");
  }
}

/** Throws ContractError if the simulation says the contract would refuse. */
export function checkSimulation(tx: AssembledTransaction<unknown>): void {
  const sim = tx.simulation;
  if (sim && rpc.Api.isSimulationError(sim)) throw new ContractError(contractErrorCode(sim.error));
  const result = tx.result as { isErr?: () => boolean } | undefined;
  if (result && typeof result.isErr === "function" && result.isErr()) throw new ContractError(null);
}

/** Simulate a read. No signing, nothing is sent. */
export async function read<T>(call: Promise<AssembledTransaction<T>>): Promise<T> {
  const tx = await call;
  const sim = tx.simulation;
  if (sim && rpc.Api.isSimulationError(sim)) throw new ContractError(contractErrorCode(sim.error));
  return tx.result;
}

/** True once the source account's sequence number is at or past this transaction's. */
async function sequenceUsed(signed: Transaction): Promise<boolean> {
  try {
    const account = await server.getAccount(signed.source);
    return BigInt(account.sequenceNumber()) >= BigInt(signed.sequence);
  } catch {
    return false; // can't tell: keep waiting
  }
}

/**
 * The ONLY place that submits a transaction. With the sponsor key set (#33),
 * each transaction goes out inside a fee bump the sponsor pays, so shops,
 * drivers and the distributor never need XLM for fees. Without it (local
 * runs), the signer pays its own fee.
 */
export async function submitSigned(signed: Transaction): Promise<{ hash: string }> {
  const outgoing = canSponsor() ? sponsorFeeBump(signed) : signed;
  const sent = await server.sendTransaction(outgoing);
  if (sent.status === "ERROR") {
    const code: string | undefined = sent.errorResult?.result.type;
    // Inside a fee bump, a used sequence number shows up as the inner result.
    if (code === "txBadSeq" || innerResultCode(sent.errorResult) === "txBadSeq") throw new BadSequence();
    // Another instance's transaction with the same sequence number is still
    // pending: to the network, a fee bump for that number looks like an attempt
    // to replace it, which needs 10x the fee. Same race, so wait and rebuild.
    if (outgoing !== signed && code === "txInsufficientFee") throw new BadSequence();
    throw new Error(`sendTransaction failed: ${describeResult(sent.errorResult)}`);
  }
  if (sent.status === "TRY_AGAIN_LATER") throw new BadSequence();

  for (let i = 0; i < POLL_TRIES; i++) {
    const got = await server.getTransaction(sent.hash);
    if (got.status === rpc.Api.GetTransactionStatus.SUCCESS) return { hash: sent.hash };
    // Simulation passed but the ledger refused it (state changed in between).
    if (got.status === rpc.Api.GetTransactionStatus.FAILED) throw new ContractError(null);
    // Another server instance sent a different transaction with the same
    // sequence number and it won: ours is dropped without an error and would
    // never show up. Once the account has moved past our number, retry.
    if (i >= 2 && (await sequenceUsed(signed))) {
      const again = await server.getTransaction(sent.hash); // ours may have just landed
      if (again.status === rpc.Api.GetTransactionStatus.SUCCESS) return { hash: sent.hash };
      if (again.status === rpc.Api.GetTransactionStatus.FAILED) throw new ContractError(null);
      throw new BadSequence();
    }
    await sleep(POLL_MS);
  }
  throw new Error(`Transaction ${sent.hash} not confirmed after ${POLL_TRIES} s`);
}

// One queue per account: calls signed by the same account wait their turn,
// so this server never races itself for a sequence number.
const queues = new Map<string, Promise<unknown>>();

function enqueue<T>(role: string, job: () => Promise<T>): Promise<T> {
  const next = (queues.get(role) ?? Promise.resolve()).then(job, job);
  queues.set(role, next.catch(() => undefined));
  return next;
}

/**
 * Build + simulate + sign as `role`, then submit. Stops on a contract error
 * (ContractError carries the Spanish message). On txBadSeq (e.g. another
 * Vercel instance used the same account) it waits, rebuilds and retries, up to 6 times.
 */
export function run(role: string, call: (client: Client) => Promise<AssembledTransaction<unknown>>) {
  return enqueue(role, async () => {
    for (let attempt = 0; ; attempt++) {
      const tx = await call(await clientFor(role));
      checkSimulation(tx);
      await tx.sign();
      if (!tx.signed) throw new Error("Transaction was not signed");
      try {
        return await submitSigned(tx.signed);
      } catch (error) {
        if (error instanceof BadSequence && attempt < MAX_RETRIES) {
          // The other instance's transaction needs a ledger (about 5 s) before
          // the account's new sequence number shows, so retrying at once just
          // fails again. Wait longer each time, with jitter so racers spread out.
          await sleep(1000 * (attempt + 1) + Math.random() * 1000);
          continue;
        }
        throw error;
      }
    }
  });
}
