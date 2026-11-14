import {Pool, ShopView, Config, Totals, Invoice, ContractEvent} from './types';
import {Result, Spec, AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions, ExternalExecutableRef} from '@stellar/stellar-sdk/contract';
import {Address, xdr} from '@stellar/stellar-sdk';

export interface Client {
  pay(args: { shop: string | Address; id: bigint; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * The shop pays back credit. Money goes to the pool for the lenders.
   * If the debt was written off (`cover_default`), it refills the buffer instead.
   */
  repay(args: { shop: string | Address; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * A lender adds money to the pool that pays invoices on credit.
   */
  deposit(args: { lender: string | Address; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  get_pool(options?: MethodOptions): Promise<AssembledTransaction<Pool>>;
  get_shop(args: { shop: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<ShopView>>;
  /**
   * Admin only: give a shop credit, or change its limit.
   */
  set_terms(args: { shop: string | Address; limit: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * The driver says "the shop gave me this much cash". Nothing changes
   * until the shop confirms it.
   */
  cash_claim(args: { driver: string | Address; id: bigint; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  get_config(options?: MethodOptions): Promise<AssembledTransaction<Config>>;
  /**
   * Everything ever invoiced and paid, by method.
   */
  get_totals(options?: MethodOptions): Promise<AssembledTransaction<Totals>>;
  /**
   * Anyone (usually the lender, at launch) can add money straight to the
   * buffer, so it isn't empty before the first credit fees arrive.
   */
  fund_buffer(args: { from: string | Address; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  get_invoice(args: { id: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<Invoice, Error>>>;
  /**
   * The shop confirms the driver's cash claim of exactly `amount`, the
   * number it was shown. If the driver changed the claim since, nothing
   * happens (`ClaimChanged`). The driver now holds that cash for the
   * distributor, and the distributor owes us the usage fee.
   */
  cash_confirm(args: { shop: string | Address; id: bigint; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * Admin only: a shop is `DEFAULT_AFTER_PERIODS` credit periods late.
   * The buffer pays the lenders back what it can, the shop's credit is
   * turned off, and the debt stays on its record as `written_off`.
   */
  cover_default(args: { shop: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * How many invoices exist. Positions run from 0 (oldest) to count - 1.
   */
  invoice_count(options?: MethodOptions): Promise<AssembledTransaction<number>>;
  /**
   * The newest `MAX_LIST` invoices, oldest first.
   */
  list_invoices(options?: MethodOptions): Promise<AssembledTransaction<Array<Invoice>>>;
  /**
   * The distributor got cash back from a driver at the warehouse.
   */
  cash_handed_in(args: { distributor: string | Address; driver: string | Address; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  create_invoice(args: { distributor: string | Address; id: bigint; shop: string | Address; driver: string | Address; amount: bigint; due: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  get_cash_claim(args: { id: bigint }, options?: MethodOptions): Promise<AssembledTransaction<bigint>>;
  get_usage_owed(args: { distributor: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<bigint>>;
  is_distributor(args: { distributor: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<boolean>>;
  get_driver_cash(args: { driver: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<bigint>>;
  /**
   * The pool pays the rest of the invoice now; the shop owes it back
   * within the credit period.
   */
  pay_with_credit(args: { shop: string | Address; id: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * The full history, newest first, a page at a time: up to `limit`
   * (at most `MAX_PAGE`) invoices at positions before `before`. Start with
   * `before` = `invoice_count()`, then pass the oldest position you got
   * (`before - page length`) to get the next page. Empty when done.
   */
  list_invoices_page(args: { before: number; limit: number }, options?: MethodOptions): Promise<AssembledTransaction<Array<Invoice>>>;
  /**
   * Admin only: let a distributor create invoices. Without this, any
   * address could invoice a shop and collect pool money as "distributor".
   */
  approve_distributor(args: { distributor: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<void>>;
}

export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new Spec(["AAAAAQAAAHJUaGUgY29udHJhY3QncyB0b2tlbiBiYWxhbmNlIGlzIGFsd2F5cyBgYXZhaWxhYmxlICsgYnVmZmVyYC4KTW9uZXkgbGVudCB0byBzaG9wcyBpcyBjb3VudGVkIGFnYWluIHdoZW4gdGhleSByZXBheS4AAAAAAAAAAAAEUG9vbAAAAAIAAAAAAAAACWF2YWlsYWJsZQAAAAAAAAsAAAAAAAAABmJ1ZmZlcgAAAAAACw==", "AAAAAQAAAAAAAAAAAAAABFNob3AAAAAPAAAAIUJvcnJvd2VkIHNpbmNlIGBvd2VkYCB3YXMgbGFzdCAwLgAAAAAAAA5jeWNsZV9ib3Jyb3dlZAAAAAAACwAAAINUcnVlIHdoaWxlIGV2ZXJ5IGludm9pY2UgY3JlZGl0ZWQgdGhpcyBjeWNsZSBoYWQgYXQgbGVhc3QgaGFsZiBwYWlkCnVwIGZyb250LiBUaGVuIHRoZSAkNDAgbWluaW11bSB0byBncm93IHRoZSBsaW1pdCBkb2Vzbid0IGFwcGx5LgAAAAATY3ljbGVfaGFsZl91cF9mcm9udAAAAAABAAAAJlVuaXggc2Vjb25kczsgMCB3aGlsZSBub3RoaW5nIGlzIG93ZWQuAAAAAAAGZHVlX2F0AAAAAAAGAAAANFVuaXggc2Vjb25kcyBvZiB0aGUgc2hvcCdzIGZpcnN0IGNyZWRpdDsgMCBpZiBuZXZlci4AAAAPZmlyc3RfY3JlZGl0X2F0AAAAAAYAAAAxVW5peCBzZWNvbmRzIG9mIHRoZSBsYXN0IGxpbWl0IHJhaXNlOyAwIGlmIG5ldmVyLgAAAAAAAA1sYXN0X3JhaXNlX2F0AAAAAAAABgAAAAAAAAAEbGF0ZQAAAAQAAAAAAAAACmxhdGVfbWFqb3IAAAAAAAQAAABHUmVwYWlkIDItNyBkYXlzIGxhdGUgLyA4KyBkYXlzIGxhdGUgKGBsYXRlYCBjb3VudHMgYm90aCwgYW5kIGRlZmF1bHRzKS4AAAAACmxhdGVfbWlub3IAAAAAAAQAAAAAAAAABWxpbWl0AAAAAAAACwAAADtUaGUgbW9zdCBkYXlzIGxhdGUgdGhlIHNob3AgaGFzIGV2ZXIgcmVwYWlkIChvciBkZWZhdWx0ZWQpLgAAAAANbWF4X2RheXNfbGF0ZQAAAAAAAAQAAABGVW5peCBzZWNvbmRzOyBubyBsaW1pdCByYWlzZSBiZWZvcmUgdGhpcyAoYWZ0ZXIgYSBtYWpvciBsYXRlIHBheW1lbnQpLgAAAAAADm5vX3JhaXNlX3VudGlsAAAAAAAGAAAAAAAAAAdvbl90aW1lAAAAAAQAAAAAAAAABG93ZWQAAAALAAAAAAAAAAx0b3RhbF9yZXBhaWQAAAALAAAAQERlYnQgdGhlIGJ1ZmZlciBjb3Zl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", "AAAABQAAAAAAAAAAAAAACFRlcm1zU2V0AAAAAQAAAAl0ZXJtc19zZXQAAAAAAAACAAAAAAAAAARzaG9wAAAAEwAAAAEAAAAAAAAABWxpbWl0AAAAAAAACwAAAAAAAAAC", "AAAAAgAAAAAAAAAAAAAACVBheU1ldGhvZAAAAAAAAAUAAAAAAAAAAAAAAAROb25lAAAAAAAAAAAAAAAHRGlnaXRhbAAAAAAAAAAAAAAAAARDYXNoAAAAAAAAAAAAAAAGQ3JlZGl0AAAAAAAAAAAAAAAAAAVNaXhlZAAAAA==", "AAAABQAAAAAAAAAAAAAACURlcG9zaXRlZAAAAAAAAAEAAAAJZGVwb3NpdGVkAAAAAAAAAgAAAAAAAAAGbGVuZGVyAAAAAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=", "AAAABQAAAAAAAAAAAAAAC0Nhc2hDbGFpbWVkAAAAAAEAAAAMY2FzaF9jbGFpbWVkAAAAAwAAAAAAAAACaWQAAAAAAAYAAAABAAAAAAAAAAZkcml2ZXIAAAAAABMAAAAAAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAAC0ludm9pY2VQYWlkAAAAAAEAAAAMaW52b2ljZV9wYWlkAAAABAAAAAAAAAACaWQAAAAAAAYAAAABAAAAAAAAAARzaG9wAAAAEwAAAAAAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAAAAAACXVzYWdlX2ZlZQAAAAAAAAsAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAADEJ1ZmZlckZ1bmRlZAAAAAEAAAANYnVmZmVyX2Z1bmRlZAAAAAAAAAIAAAAAAAAABGZyb20AAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=", "AAAABQAAAAAAAAAAAAAADENhc2hIYW5kZWRJbgAAAAEAAAAOY2FzaF9oYW5kZWRfaW4AAAAAAAMAAAAAAAAABmRyaXZlcgAAAAAAEwAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAAAAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==", "AAAAAgAAAAAAAAAAAAAADUludm9pY2VTdGF0dXMAAAAAAAADAAAAAAAAAAAAAAADRHVlAAAAAAAAAAAAAAAACFBhcnRQYWlkAAAAAAAAAAAAAAAEUGFpZA==", "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", "AAAAAAAAAINBbnlvbmUgKHVzdWFsbHkgdGhlIGxlbmRlciwgYXQgbGF1bmNoKSBjYW4gYWRkIG1vbmV5IHN0cmFpZ2h0IHRvIHRoZQpidWZmZXIsIHNvIGl0IGlzbid0IGVtcHR5IGJlZm9yZSB0aGUgZmlyc3QgY3JlZGl0IGZlZXMgYXJyaXZlLgAAAAALZnVuZF9idWZmZXIAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAAAM=", "AAAAAAAAAAAAAAALZ2V0X2ludm9pY2UAAAAAAQAAAAAAAAACaWQAAAAAAAYAAAABAAAD6QAAB9AAAAAHSW52b2ljZQAAAAAD", "AAAAAAAAAP9UaGUgc2hvcCBjb25maXJtcyB0aGUgZHJpdmVyJ3MgY2FzaCBjbGFpbSBvZiBleGFjdGx5IGBhbW91bnRgLCB0aGUKbnVtYmVyIGl0IHdhcyBzaG93bi4gSWYgdGhlIGRyaXZlciBjaGFuZ2VkIHRoZSBjbGFpbSBzaW5jZSwgbm90aGluZwpoYXBwZW5zIChgQ2xhaW1DaGFuZ2VkYCkuIFRoZSBkcml2ZXIgbm93IGhvbGRzIHRoYXQgY2FzaCBmb3IgdGhlCmRpc3RyaWJ1dG9yLCBhbmQgdGhlIGRpc3RyaWJ1dG9yIG93ZXMgdXMgdGhlIHVzYWdlIGZlZS4AAAAADGNhc2hfY29uZmlybQAAAAMAAAAAAAAABHNob3AAAAATAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAQAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAh0cmVhc3VyeQAAABMAAAAAAAAAEmNyZWRpdF9wZXJpb2Rfc2VjcwAAAAAABgAAAAA=", "AAAAAAAAAMRBZG1pbiBvbmx5OiBhIHNob3AgaXMgYERFRkFVTFRfQUZURVJfUEVSSU9EU2AgY3JlZGl0IHBlcmlvZHMgbGF0ZS4KVGhlIGJ1ZmZlciBwYXlzIHRoZSBsZW5kZXJzIGJhY2sgd2hhdCBpdCBjYW4sIHRoZSBzaG9wJ3MgY3JlZGl0IGlzCnR1cm5lZCBvZmYsIGFuZCB0aGUgZGVidCBzdGF5cyBvbiBpdHMgcmVjb3JkIGFzIGB3cml0dGVuX29mZmAuAAAADWNvdmVyX2RlZmF1bHQAAAAAAAABAAAAAAAAAARzaG9wAAAAEwAAAAEAAAPpAAAAAgAAAAM=", "AAAAAAAAAERIb3cgbWFueSBpbnZvaWNlcyBleGlzdC4gUG9zaXRpb25zIHJ1biBmcm9tIDAgKG9sZGVzdCkgdG8gY291bnQgLSAxLgAAAA1pbnZvaWNlX2NvdW50AAAAAAAAAAAAAAEAAAAE", "AAAAAAAAAC1UaGUgbmV3ZXN0IGBNQVhfTElTVGAgaW52b2ljZXMsIG9sZGVzdCBmaXJzdC4AAAAAAAANbGlzdF9pbnZvaWNlcwAAAAAAAAAAAAABAAAD6gAAB9AAAAAHSW52b2ljZQA=", "AAAAAAAAAD1UaGUgZGlzdHJpYnV0b3IgZ290IGNhc2ggYmFjayBmcm9tIGEgZHJpdmVyIGF0IHRoZSB3YXJlaG91c2UuAAAAAAAADmNhc2hfaGFuZGVkX2luAAAAAAADAAAAAAAAAAtkaXN0cmlidXRvcgAAAAATAAAAAAAAAAZkcml2ZXIAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAAAM=", "AAAAAAAAAAAAAAAOY3JlYXRlX2ludm9pY2UAAAAAAAYAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAARzaG9wAAAAEwAAAAAAAAAGZHJpdmVyAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAA2R1ZQAAAAAGAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAAAAAAAOZ2V0X2Nhc2hfY2xhaW0AAAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAQAAAAs=", "AAAAAAAAAAAAAAAOZ2V0X3VzYWdlX293ZWQAAAAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAABAAAACw==", "AAAAAAAAAAAAAAAOaXNfZGlzdHJpYnV0b3IAAAAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAABAAAAAQ==", "AAAAAAAAAAAAAAAPZ2V0X2RyaXZlcl9jYXNoAAAAAAEAAAAAAAAABmRyaXZlcgAAAAAAEwAAAAEAAAAL", "AAAAAAAAAFpUaGUgcG9vbCBwYXlzIHRoZSByZXN0IG9mIHRoZSBpbnZvaWNlIG5vdzsgdGhlIHNob3Agb3dlcyBpdCBiYWNrCndpdGhpbiB0aGUgY3JlZGl0IHBlcmlvZC4AAAAAAA9wYXlfd2l0aF9jcmVkaXQAAAAAAgAAAAAAAAAEc2hvcAAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAQpUaGUgZnVsbCBoaXN0b3J5LCBuZXdlc3QgZmlyc3QsIGEgcGFnZSBhdCBhIHRpbWU6IHVwIHRvIGBsaW1pdGAKKGF0IG1vc3QgYE1BWF9QQUdFYCkgaW52b2ljZXMgYXQgcG9zaXRpb25zIGJlZm9yZSBgYmVmb3JlYC4gU3RhcnQgd2l0aApgYmVmb3JlYCA9IGBpbnZvaWNlX2NvdW50KClgLCB0aGVuIHBhc3MgdGhlIG9sZGVzdCBwb3NpdGlvbiB5b3UgZ290CihgYmVmb3JlIC0gcGFnZSBsZW5ndGhgKSB0byBnZXQgdGhlIG5leHQgcGFnZS4gRW1wdHkgd2hlbiBkb25lLgAAAAAAEmxpc3RfaW52b2ljZXNfcGFnZQAAAAAAAgAAAAAAAAAGYmVmb3JlAAAAAAAEAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAHSW52b2ljZQA=", "AAAAAAAAAIZBZG1pbiBvbmx5OiBsZXQgYSBkaXN0cmlidXRvciBjcmVhdGUgaW52b2ljZXMuIFdpdGhvdXQgdGhpcywgYW55CmFkZHJlc3MgY291bGQgaW52b2ljZSBhIHNob3AgYW5kIGNvbGxlY3QgcG9vbCBtb25leSBhcyAiZGlzdHJpYnV0b3IiLgAAAAAAE2FwcHJvdmVfZGlzdHJpYnV0b3IAAAAAAQAAAAAAAAALZGlzdHJpYnV0b3IAAAAAEwAAAAA=", "AAAAAgAAAF9Db250cmFjdCBleGVjdXRhYmxlIHVzZWQgZm9yIGNyZWF0aW5nIGEgbmV3IGNvbnRyYWN0IGFuZCB1c2VkIGluCmBDcmVhdGVDb250cmFjdEhvc3RGbkNvbnRleHRgLgAAAAAAAAAAEkNvbnRyYWN0RXhlY3V0YWJsZQAAAAAAAgAAAAEAAAB4RXhlY3V0YWJsZSBzcGVjaWZpZWQgYnkgdGhlIGNvbnRyYWN0IGluc3RhbmNlIGFzIGEgc3BlY2lmaWMgV2FzbSBjb250cmFjdCBjb2RlIGVudHJ5IGlkZW50aWZpZWQgYnkgaXRzIFdhc20gc2hhMjU2IGhhc2guAAAABFdhc20AAAABAAAD7gAAACAAAAABAAAAX0V4ZWN1dGFibGUgcmVmZXJlbmNlIHZpYSBhIHBlcnNpc3RlbnQgc3RvcmFnZSBlbnRyeSBvd25lZCBieSB0aGlzIGNvbnRyYWN0IG9yIGFub3RoZXIgY29udHJhY3QuAAAAAAtFeHRlcm5hbFJlZgAAAAABAAAH0AAAABVDb250cmFjdEV4ZWN1dGFibGVSZWYAAAA=", "AAAAAQAAAMBFeGVjdXRhYmxlIHJlZmVyZW5jZWQgdmlhIGEgcGVyc2lzdGVudCBzdG9yYWdlIGVudHJ5IG93bmVkIGJ5IGEgY29udHJhY3QsCmVpdGhlciB0aGlzIGNvbnRyYWN0IG9yIGFub3RoZXIgY29udHJhY3QuCgpUaGUgcGVyc2lzdGVudCBzdG9yYWdlIGVudHJ5IG93bmVkIGJ5IHRoZSBgb3duZXJgIGhhcyB0aGUgYHRhZ2AgYXMgaXRzIGtleS4AAAAAAAAAFUNvbnRyYWN0RXhlY3V0YWJsZVJlZgAAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAADdGFnAAAAABA=", "AAAAAgAAAONDb250ZXh0IG9mIGEgc2luZ2xlIGF1dGhvcml6ZWQgY2FsbCBwZXJmb3JtZWQgYnkgYW4gYWRkcmVzcy4KCkN1c3RvbSBhY2NvdW50IGNvbnRyYWN0cyB0aGF0IGltcGxlbWVudCBgX19jaGVja19hdXRoYCBzcGVjaWFsIGZ1bmN0aW9uCnJlY2VpdmUgYSBsaXN0IG9mIGBDb250ZXh0YCB2YWx1ZXMgY29ycmVzcG9uZGluZyB0byBhbGwgdGhlIGNhbGxzIHRoYXQKbmVlZCB0byBiZSBhdXRob3JpemVkLgAAAAAAAAAAB0NvbnRleHQAAAAAAwAAAAEAAAAUQ29udHJhY3QgaW52b2NhdGlvbi4AAAAIQ29udHJhY3QAAAABAAAH0AAAAA9Db250cmFjdENvbnRleHQAAAAAAQAAAD1Db250cmFjdCB0aGF0IGhhcyBhIGNvbnN0cnVjdG9yIHdpdGggbm8gYXJndW1lbnRzIGlzIGNyZWF0ZWQuAAAAAAAAFENyZWF0ZUNvbnRyYWN0SG9zdEZuAAAAAQAAB9AAAAAbQ3JlYXRlQ29udHJhY3RIb3N0Rm5Db250ZXh0AAAAAAEAAABEQ29udHJhY3QgdGhhdCBoYXMgYSBjb25zdHJ1Y3RvciB3aXRoIDEgb3IgbW9yZSBhcmd1bWVudHMgaXMgY3JlYXRlZC4AAAAcQ3JlYXRlQ29udHJhY3RXaXRoQ3Rvckhvc3RGbgAAAAEAAAfQAAAAKkNyZWF0ZUNvbnRyYWN0V2l0aENvbnN0cnVjdG9ySG9zdEZuQ29udGV4dAAA", "AAAAAQAAAL1BdXRob3JpemF0aW9uIGNvbnRleHQgb2YgYSBzaW5nbGUgY29udHJhY3QgY2FsbC4KClRoaXMgc3RydWN0IGNvcnJlc3BvbmRzIHRvIGEgYHJlcXVpcmVfYXV0aF9mb3JfYXJnc2AgY2FsbCBmb3IgYW4gYWRkcmVzcwpmcm9tIGBjb250cmFjdGAgZnVuY3Rpb24gd2l0aCBgZm5fbmFtZWAgbmFtZSBhbmQgYGFyZ3NgIGFyZ3VtZW50cy4AAAAAAAAAAAAAD0NvbnRyYWN0Q29udGV4dAAAAAADAAAAAAAAAARhcmdzAAAD6gAAAAAAAAAAAAAACGNvbnRyYWN0AAAAEwAAAAAAAAAHZm5fbmFtZQAAAAAR", "AAAAAQAAADhWYWx1ZSBvZiBjb250cmFjdCBub2RlIGluIEludm9rZXJDb250cmFjdEF1dGhFbnRyeSB0cmVlLgAAAAAAAAAVU3ViQ29udHJhY3RJbnZvY2F0aW9uAAAAAAAAAgAAAAAAAAAHY29udGV4dAAAAAfQAAAAD0NvbnRyYWN0Q29udGV4dAAAAAAAAAAAD3N1Yl9pbnZvY2F0aW9ucwAAAAPqAAAH0AAAABhJbnZva2VyQ29udHJhY3RBdXRoRW50cnk=", "AAAAAgAAAS9BIG5vZGUgaW4gdGhlIHRyZWUgb2YgYXV0aG9yaXphdGlvbnMgcGVyZm9ybWVkIG9uIGJlaGFsZiBvZiB0aGUgY3VycmVudApjb250cmFjdCBhcyBpbnZva2VyIG9mIHRoZSBjb250cmFjdHMgZGVlcGVyIGluIHRoZSBjYWxsIHN0YWNrLgoKVGhpcyBpcyB1c2VkIGFzIGFuIGFyZ3VtZW50IG9mIGBhdXRob3JpemVfYXNfY3VycmVudF9jb250cmFjdGAgaG9zdCBmdW5jdGlvbi4KClRoaXMgdHJlZSBjb3JyZXNwb25kcyBgcmVxdWlyZV9hdXRoW19mb3JfYXJnc11gIGNhbGxzIG9uIGJlaGFsZiBvZiB0aGUKY3VycmVudCBjb250cmFjdC4AAAAAAAAAABhJbnZva2VyQ29udHJhY3RBdXRoRW50cnkAAAADAAAAAQAAABJJbnZva2UgYSBjb250cmFjdC4AAAAAAAhDb250cmFjdAAAAAEAAAfQAAAAFVN1YkNvbnRyYWN0SW52b2NhdGlvbgAAAAAAAAEAAAA1Q3JlYXRlIGEgY29udHJhY3QgcGFzc2luZyAwIGFyZ3VtZW50cyB0byBjb25zdHJ1Y3Rvci4AAAAAAAAUQ3JlYXRlQ29udHJhY3RIb3N0Rm4AAAABAAAH0AAAABtDcmVhdGVDb250cmFjdEhvc3RGbkNvbnRleHQAAAAAAQAAAD1DcmVhdGUgYSBjb250cmFjdCBwYXNzaW5nIDAgb3IgbW9yZSBhcmd1bWVudHMgdG8gY29uc3RydWN0b3IuAAAAAAAAHENyZWF0ZUNvbnRyYWN0V2l0aEN0b3JIb3N0Rm4AAAABAAAH0AAAACpDcmVhdGVDb250cmFjdFdpdGhDb25zdHJ1Y3Rvckhvc3RGbkNvbnRleHQAAA==", "AAAAAQAAAHZBdXRob3JpemF0aW9uIGNvbnRleHQgZm9yIGBjcmVhdGVfY29udHJhY3RgIGhvc3QgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIGEKbmV3IGNvbnRyYWN0IG9uIGJlaGFsZiBvZiBhdXRob3JpemVyIGFkZHJlc3MuAAAAAAAAAAAAG0NyZWF0ZUNvbnRyYWN0SG9zdEZuQ29udGV4dAAAAAACAAAAAAAAAApleGVjdXRhYmxlAAAAAAfQAAAAEkNvbnRyYWN0RXhlY3V0YWJsZQAAAAAAAAAAAARzYWx0AAAD7gAAACA=", "AAAAAQAAANZBdXRob3JpemF0aW9uIGNvbnRleHQgZm9yIGBjcmVhdGVfY29udHJhY3RgIGhvc3QgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIGEKbmV3IGNvbnRyYWN0IG9uIGJlaGFsZiBvZiBhdXRob3JpemVyIGFkZHJlc3MuClRoaXMgaXMgdGhlIHNhbWUgYXMgYENyZWF0ZUNvbnRyYWN0SG9zdEZuQ29udGV4dGAsIGJ1dCBhbHNvIGhhcwpjb250cmFjdCBjb25zdHJ1Y3RvciBhcmd1bWVudHMuAAAAAAAAAAAAKkNyZWF0ZUNvbnRyYWN0V2l0aENvbnN0cnVjdG9ySG9zdEZuQ29udGV4dAAAAAAAAwAAAAAAAAAQY29uc3RydWN0b3JfYXJncwAAA+oAAAAAAAAAAAAAAApleGVjdXRhYmxlAAAAAAfQAAAAEkNvbnRyYWN0RXhlY3V0YWJsZQAAAAAAAAAAAARzYWx0AAAD7gAAACA=", "AAAAAgAAAAAAAAAAAAAACkV4ZWN1dGFibGUAAAAAAAMAAAABAAAAAAAAAARXYXNtAAAAAQAAA+4AAAAgAAAAAAAAAAAAAAAMU3RlbGxhckFzc2V0AAAAAAAAAAAAAAAHQWNjb3VudAA="]),
      options
    );
  }

   static deploy<T = Client>(args: { admin: string | Address; token: string | Address; treasury: string | Address; credit_period_secs: bigint }, options: MethodOptions & Omit<ContractClientOptions, 'contractId'> & { salt?: Uint8Array; address?: string; } & ({ wasmHash: Uint8Array | string; format?: "hex" | "base64"; externalRef?: never; } | { externalRef: ExternalExecutableRef; wasmHash?: never; format?: never; })): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(args, options);
  }
  public readonly fromJson = {
    pay : this.txFromJson<Result<null, Error>>,  repay : this.txFromJson<Result<null, Error>>,  deposit : this.txFromJson<Result<null, Error>>,  get_pool : this.txFromJson<Pool>,  get_shop : this.txFromJson<ShopView>,  set_terms : this.txFromJson<Result<null, Error>>,  cash_claim : this.txFromJson<Result<null, Error>>,  get_config : this.txFromJson<Config>,  get_totals : this.txFromJson<Totals>,  fund_buffer : this.txFromJson<Result<null, Error>>,  get_invoice : this.txFromJson<Result<Invoice, Error>>,  cash_confirm : this.txFromJson<Result<null, Error>>,  cover_default : this.txFromJson<Result<null, Error>>,  invoice_count : this.txFromJson<number>,  list_invoices : this.txFromJson<Array<Invoice>>,  cash_handed_in : this.txFromJson<Result<null, Error>>,  create_invoice : this.txFromJson<Result<null, Error>>,  get_cash_claim : this.txFromJson<bigint>,  get_usage_owed : this.txFromJson<bigint>,  is_distributor : this.txFromJson<boolean>,  get_driver_cash : this.txFromJson<bigint>,  pay_with_credit : this.txFromJson<Result<null, Error>>,  list_invoices_page : this.txFromJson<Array<Invoice>>,  approve_distributor : this.txFromJson<void>
  };

  /** @deprecated Use fromJson instead. */
  public readonly fromJSON = this.fromJson;

  /**
   * Parse a raw contract event (topics + data) into a typed {@link ContractEvent}.
   */
  parseEvent(topics: xdr.ScVal[] | string[], data: xdr.ScVal | string): ContractEvent | undefined {
    return this.spec.parseEvent(topics, data) as ContractEvent | undefined;
  }
  /**
   * Build a topics filter row for the "Repaid" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  repaidEventFilter(topicValues?: { shop?: string | Address }): string[] {
    return this.spec.eventTopicFilter("Repaid", topicValues);
  }
  /**
   * Build a topics filter row for the "TermsSet" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  termsSetEventFilter(topicValues?: { shop?: string | Address }): string[] {
    return this.spec.eventTopicFilter("TermsSet", topicValues);
  }
  /**
   * Build a topics filter row for the "Deposited" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  depositedEventFilter(topicValues?: { lender?: string | Address }): string[] {
    return this.spec.eventTopicFilter("Deposited", topicValues);
  }
  /**
   * Build a topics filter row for the "CashClaimed" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  cashClaimedEventFilter(topicValues?: { id?: bigint }): string[] {
    return this.spec.eventTopicFilter("CashClaimed", topicValues);
  }
  /**
   * Build a topics filter row for the "InvoicePaid" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  invoicePaidEventFilter(topicValues?: { id?: bigint }): string[] {
    return this.spec.eventTopicFilter("InvoicePaid", topicValues);
  }
  /**
   * Build a topics filter row for the "BufferFunded" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  bufferFundedEventFilter(topicValues?: { from?: string | Address }): string[] {
    return this.spec.eventTopicFilter("BufferFunded", topicValues);
  }
  /**
   * Build a topics filter row for the "CashHandedIn" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  cashHandedInEventFilter(topicValues?: { driver?: string | Address }): string[] {
    return this.spec.eventTopicFilter("CashHandedIn", topicValues);
  }
  /**
   * Build a topics filter row for the "CashConfirmed" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  cashConfirmedEventFilter(topicValues?: { id?: bigint }): string[] {
    return this.spec.eventTopicFilter("CashConfirmed", topicValues);
  }
  /**
   * Build a topics filter row for the "DefaultCovered" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  defaultCoveredEventFilter(topicValues?: { shop?: string | Address }): string[] {
    return this.spec.eventTopicFilter("DefaultCovered", topicValues);
  }
  /**
   * Build a topics filter row for the "InvoiceCreated" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  invoiceCreatedEventFilter(topicValues?: { id?: bigint }): string[] {
    return this.spec.eventTopicFilter("InvoiceCreated", topicValues);
  }
  /**
   * Build a topics filter row for the "PaidWithCredit" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  paidWithCreditEventFilter(topicValues?: { id?: bigint }): string[] {
    return this.spec.eventTopicFilter("PaidWithCredit", topicValues);
  }
  /**
   * Build a topics filter row for the "DistributorApproved" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  distributorApprovedEventFilter(topicValues?: { distributor?: string | Address }): string[] {
    return this.spec.eventTopicFilter("DistributorApproved", topicValues);
  }
}