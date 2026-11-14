import {Pool, ShopView, Config, LenderView, Totals, Invoice, RecourseView, ContractEvent} from './types';
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
   * A distributor vouches for a shop it knows, or stops (#185). Its
   * invoices to that shop then cost 0.25% on credit, backed by its deposit.
   * Only while the shop owes nothing, so no debt changes hands.
   */
  vouch(args: { distributor: string | Address; shop: string | Address; on: boolean }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * An approved lender adds money to the pool that pays invoices on credit,
   * and gets shares at today's value, so earlier lenders keep what they earned.
   */
  deposit(args: { lender: string | Address; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  get_pool(options?: MethodOptions): Promise<AssembledTransaction<Pool>>;
  get_shop(args: { shop: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<ShopView>>;
  /**
   * A lender takes money out by giving back shares. Only money that is not
   * lent out can leave; the rest comes back as shops repay.
   */
  withdraw(args: { lender: string | Address; shares: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<bigint, Error>>>;
  is_lender(args: { lender: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<boolean>>;
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
  get_lender(args: { lender: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<LenderView>>;
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
  get_recourse(args: { distributor: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<RecourseView>>;
  /**
   * Anyone can call this once a shop the distributor vouches for is more
   * than `MINOR_LATE_DAYS` days late (#185). The distributor's deposit pays
   * the pool the vouched part, and the distributor collects from the shop
   * itself. It counts as a major late payment on the shop's record.
   */
  call_recourse(args: { shop: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<Result<bigint, Error>>>;
  /**
   * Anyone can call this once a shop is `DEFAULT_AFTER_PERIODS` credit
   * periods late, so lenders are never stuck waiting on the admin. The
   * buffer pays the lenders back what it can, the shop's credit is turned
   * off, and the debt stays on its record as `written_off`.
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
   * Admin only: let a licensed lender put money in the pool. Lenders can
   * be anywhere, as long as they hold the pool's dollars on Stellar.
   */
  approve_lender(args: { lender: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<void>>;
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
   * An approved distributor adds to its recourse deposit.
   */
  deposit_recourse(args: { distributor: string | Address; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
  /**
   * The distributor takes deposit back, as long as 20% of its vouched
   * credit still out stays covered.
   */
  withdraw_recourse(args: { distributor: string | Address; amount: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Result<null, Error>>>;
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
      new Spec(["AAAAAQAAAHJUaGUgY29udHJhY3QncyB0b2tlbiBiYWxhbmNlIGlzIGFsd2F5cyBgYXZhaWxhYmxlICsgYnVmZmVyYC4KTW9uZXkgbGVudCB0byBzaG9wcyBpcyBjb3VudGVkIGFnYWluIHdoZW4gdGhleSByZXBheS4AAAAAAAAAAAAEUG9vbAAAAAUAAAAAAAAACWF2YWlsYWJsZQAAAAAAAAsAAAAAAAAABmJ1ZmZlcgAAAAAACwAAAEZDcmVkaXQgdGhlIHBvb2wgaGFzIG91dCB3aXRoIHNob3BzIHJpZ2h0IG5vdyAod2hhdCB0aGV5IHN0aWxsIG93ZSBpdCkuAAAAAAAEbGVudAAAAAsAAAB8RGlzdHJpYnV0b3JzJyByZWNvdXJzZSBkZXBvc2l0cyAoIzE4NSkuIE5vdCBsZW5kZXJzJyBtb25leTogdGhlCmNvbnRyYWN0J3MgdG9rZW4gYmFsYW5jZSBpcyBgYXZhaWxhYmxlICsgYnVmZmVyICsgcmVjb3Vyc2VgLgAAAAhyZWNvdXJzZQAAAAsAAABGTGVuZGVyIHNoYXJlcyBpc3N1ZWQuIEVhY2ggc2hhcmUgaXMgd29ydGggKGF2YWlsYWJsZSArIGxlbnQpIC8gc2hhcmVzLgAAAAAABnNoYXJlcwAAAAAACw==", "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAEwAAAAAAAAANQWxyZWFkeUV4aXN0cwAAAAAAAAEAAAAAAAAACE5vdEZvdW5kAAAAAgAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAMAAAAAAAAAB092ZXJwYXkAAAAABAAAAAAAAAALQWxyZWFkeVBhaWQAAAAABQAAAAAAAAAOTm90WW91ckludm9pY2UAAAAAAAYAAAAAAAAAB092ZXJkdWUAAAAABwAAAAAAAAAJT3ZlckxpbWl0AAAAAAAACAAAAAAAAAAKUG9vbFRvb0xvdwAAAAAACQAAAAAAAAALTm90aGluZ093ZWQAAAAACgAAAAAAAAALTm9DYXNoQ2xhaW0AAAAACwAAAAAAAAANTm9DcmVkaXRUZXJtcwAAAAAAAAwAAAAAAAAAC05vdEFwcHJvdmVkAAAAAA0AAAAAAAAADE5vdEluRGVmYXVsdAAAAA4AAAA8VGhlIGRyaXZlcidzIGNhc2ggY2xhaW0gaXNuJ3QgdGhlIGFtb3VudCB0aGUgc2hvcCBjb25maXJtZWQuAAAADENsYWltQ2hhbmdlZAAAAA8AAAAwT25seSBhcHByb3ZlZCBsZW5kZXJzIGNhbiBwdXQgbW9uZXkgaW4gdGhlIHBvb2wuAAAACU5vdExlbmRlcgAAAAAAABAAAAAvVGhlIGxlbmRlciBhc2tlZCBmb3IgbW9yZSBzaGFyZXMgdGhhbiBpdCBob2xkcy4AAAAAD05vdEVub3VnaFNoYXJlcwAAAAARAAAATlRoZSBkaXN0cmlidXRvcidzIHJlY291cnNlIGRlcG9zaXQgd291bGQgZHJvcCBiZWxvdyAyMCUgb2YgaXRzIHZvdWNoZWQgY3JlZGl0LgAAAAAAEE5vdEVub3VnaERlcG9zaXQAAAASAAAAPVdobyB2b3VjaGVzIGZvciBhIHNob3AgY2FuIG9ubHkgY2hhbmdlIHdoaWxlIGl0IG93ZXMgbm90aGluZy4AAAAAAAAIU2hvcE93ZXMAAAAT", "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", "AAAABQAAAAAAAAAAAAAACVdpdGhkcmF3bgAAAAAAAAEAAAAJd2l0aGRyYXduAAAAAAAAAwAAAAAAAAAGbGVuZGVyAAAAAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAAAAAAGc2hhcmVzAAAAAAALAAAAAAAAAAI=", "AAAAAQAAAExXaGF0IGEgbGVuZGVyIHNlZXM6IGl0cyBzaGFyZXMsIHdoYXQgdGhleSBhcmUgd29ydGggbm93LCBhbmQgd2hhdCBpdCBwdXQgaW4uAAAAAAAAAApMZW5kZXJWaWV3AAAAAAAEAAAAAAAAAAhhcHByb3ZlZAAAAAEAAAAAAAAADW5ldF9kZXBvc2l0ZWQAAAAAAAALAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAAAAAAABXZhbHVlAAAAAAAACw==", "AAAABQAAAAAAAAAAAAAAC0Nhc2hDbGFpbWVkAAAAAAEAAAAMY2FzaF9jbGFpbWVkAAAAAwAAAAAAAAACaWQAAAAAAAYAAAABAAAAAAAAAAZkcml2ZXIAAAAAABMAAAAAAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAAC0ludm9pY2VQYWlkAAAAAAEAAAAMaW52b2ljZV9wYWlkAAAABAAAAAAAAAACaWQAAAAAAAYAAAABAAAAAAAAAARzaG9wAAAAEwAAAAAAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAAAAAACXVzYWdlX2ZlZQAAAAAAAAsAAAAAAAAAAg==", "AAAAAQAAADNBIGRpc3RyaWJ1dG9yJ3MgcmVjb3Vyc2UgZGVwb3NpdCBhbmQgd2hhdCBpdCBiYWNrcy4AAAAAAAAAAAxSZWNvdXJzZVZpZXcAAAADAAAAAAAAAAdkZXBvc2l0AAAAAAsAAAA/VGhlIGxlYXN0IHRoZSBkZXBvc2l0IGNhbiBiZTogMjAlIG9mIGB2b3VjaGVkX291dGAsIHJvdW5kZWQgdXAuAAAAAAhyZXF1aXJlZAAAAAsAAAAtVm91Y2hlZCBjcmVkaXQgdGhhdCBzaG9wcyBzdGlsbCBvd2UgdGhlIHBvb2wuAAAAAAAAC3ZvdWNoZWRfb3V0AAAAAAs=", "AAAABQAAAAAAAAAAAAAADEJ1ZmZlckZ1bmRlZAAAAAEAAAANYnVmZmVyX2Z1bmRlZAAAAAAAAAIAAAAAAAAABGZyb20AAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=", "AAAABQAAAAAAAAAAAAAADENhc2hIYW5kZWRJbgAAAAEAAAAOY2FzaF9oYW5kZWRfaW4AAAAAAAMAAAAAAAAABmRyaXZlcgAAAAAAEwAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAAAAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==", "AAAAAgAAAAAAAAAAAAAADUludm9pY2VTdGF0dXMAAAAAAAADAAAAAAAAAAAAAAADRHVlAAAAAAAAAAAAAAAACFBhcnRQYWlkAAAAAAAAAAAAAAAEUGFpZA==", "AAAABQAAAAAAAAAAAAAADUNhc2hDb25maXJtZWQAAAAAAAABAAAADmNhc2hfY29uZmlybWVkAAAAAAAEAAAAAAAAAAJpZAAAAAAABgAAAAEAAAAAAAAABHNob3AAAAATAAAAAAAAAAAAAAAGZHJpdmVyAAAAAAATAAAAAAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=", "AAAABQAAAAAAAAAAAAAADkRlZmF1bHRDb3ZlcmVkAAAAAAABAAAAD2RlZmF1bHRfY292ZXJlZAAAAAADAAAAAAAAAARzaG9wAAAAEwAAAAEAAAAAAAAABG93ZWQAAAALAAAAAAAAAENIb3cgbXVjaCB0aGUgYnVmZmVyIGNvdWxkIHBheSBiYWNrIHRvIHRoZSBsZW5kZXJzIChhdCBtb3N0IGBvd2VkYCkuAAAAAAdjb3ZlcmVkAAAAAAsAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAADkludm9pY2VDcmVhdGVkAAAAAAABAAAAD2ludm9pY2VfY3JlYXRlZAAAAAAFAAAAAAAAAAJpZAAAAAAABgAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAAAAAAAAAAAAARzaG9wAAAAEwAAAAAAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAAAAAAA2R1ZQAAAAAGAAAAAAAAAAI=", "AAAABQAAAAAAAAAAAAAADkxlbmRlckFwcHJvdmVkAAAAAAABAAAAD2xlbmRlcl9hcHByb3ZlZAAAAAABAAAAAAAAAAZsZW5kZXIAAAAAABMAAAABAAAAAg==", "AAAABQAAAAAAAAAAAAAADlBhaWRXaXRoQ3JlZGl0AAAAAAABAAAAEHBhaWRfd2l0aF9jcmVkaXQAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAEAAAAAAAAABHNob3AAAAATAAAAAAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAAAAAAGcGF5b3V0AAAAAAALAAAAAAAAAAAAAAAGZHVlX2F0AAAAAAAGAAAAAAAAAEJUcnVlIHdoZW4gdGhlIHZvdWNoZXIncyBkZXBvc2l0IGJhY2tzIGl0ICh0aGUgMC4yNSUgcmVjb3Vyc2UgZmVlKS4AAAAAAAhyZWNvdXJzZQAAAAEAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAADlJlY291cnNlQ2FsbGVkAAAAAAABAAAAD3JlY291cnNlX2NhbGxlZAAAAAAEAAAAAAAAAARzaG9wAAAAEwAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAAAAAAAH1doYXQgdGhlIGRlcG9zaXQgcGFpZCB0aGUgcG9vbC4AAAAABHBhaWQAAAALAAAAAAAAAC1XaGF0IHRoZSBzaG9wIHN0aWxsIG93ZXMgdGhlIHBvb2wgYWZ0ZXIgdGhhdC4AAAAAAAAEb3dlZAAAAAsAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAAEVJlY291cnNlRGVwb3NpdGVkAAAAAAAAAQAAABJyZWNvdXJzZV9kZXBvc2l0ZWQAAAAAAAIAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAAEVJlY291cnNlV2l0aGRyYXduAAAAAAAAAQAAABJyZWNvdXJzZV93aXRoZHJhd24AAAAAAAIAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==", "AAAABQAAAAAAAAAAAAAAE0Rpc3RyaWJ1dG9yQXBwcm92ZWQAAAAAAQAAABRkaXN0cmlidXRvcl9hcHByb3ZlZAAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAABAAAAAg==", "AAAAAAAAAAAAAAADcGF5AAAAAAMAAAAAAAAABHNob3AAAAATAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAJBUaGUgc2hvcCBwYXlzIGJhY2sgY3JlZGl0LiBNb25leSBnb2VzIHRvIHRoZSBwb29sIGZvciB0aGUgbGVuZGVycy4KSWYgdGhlIGRlYnQgd2FzIHdyaXR0ZW4gb2ZmIChgY292ZXJfZGVmYXVsdGApLCBpdCByZWZpbGxzIHRoZSBidWZmZXIgaW5zdGVhZC4AAAAFcmVwYXkAAAAAAAACAAAAAAAAAARzaG9wAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAMNBIGRpc3RyaWJ1dG9yIHZvdWNoZXMgZm9yIGEgc2hvcCBpdCBrbm93cywgb3Igc3RvcHMgKCMxODUpLiBJdHMKaW52b2ljZXMgdG8gdGhhdCBzaG9wIHRoZW4gY29zdCAwLjI1JSBvbiBjcmVkaXQsIGJhY2tlZCBieSBpdHMgZGVwb3NpdC4KT25seSB3aGlsZSB0aGUgc2hvcCBvd2VzIG5vdGhpbmcsIHNvIG5vIGRlYnQgY2hhbmdlcyBoYW5kcy4AAAAABXZvdWNoAAAAAAAAAwAAAAAAAAALZGlzdHJpYnV0b3IAAAAAEwAAAAAAAAAEc2hvcAAAABMAAAAAAAAAAm9uAAAAAAABAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAJNBbiBhcHByb3ZlZCBsZW5kZXIgYWRkcyBtb25leSB0byB0aGUgcG9vbCB0aGF0IHBheXMgaW52b2ljZXMgb24gY3JlZGl0LAphbmQgZ2V0cyBzaGFyZXMgYXQgdG9kYXkncyB2YWx1ZSwgc28gZWFybGllciBsZW5kZXJzIGtlZXAgd2hhdCB0aGV5IGVhcm5lZC4AAAAAB2RlcG9zaXQAAAAAAgAAAAAAAAAGbGVuZGVyAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAAD", "AAAAAAAAAAAAAAAIZ2V0X3Bvb2wAAAAAAAAAAQAAB9AAAAAEUG9vbA==", "AAAAAAAAAAAAAAAIZ2V0X3Nob3AAAAABAAAAAAAAAARzaG9wAAAAEwAAAAEAAAfQAAAACFNob3BWaWV3", "AAAAAAAAAH5BIGxlbmRlciB0YWtlcyBtb25leSBvdXQgYnkgZ2l2aW5nIGJhY2sgc2hhcmVzLiBPbmx5IG1vbmV5IHRoYXQgaXMgbm90CmxlbnQgb3V0IGNhbiBsZWF2ZTsgdGhlIHJlc3QgY29tZXMgYmFjayBhcyBzaG9wcyByZXBheS4AAAAAAAh3aXRoZHJhdwAAAAIAAAAAAAAABmxlbmRlcgAAAAAAEwAAAAAAAAAGc2hhcmVzAAAAAAALAAAAAQAAA+kAAAALAAAAAw==", "AAAAAAAAAAAAAAAJaXNfbGVuZGVyAAAAAAAAAQAAAAAAAAAGbGVuZGVyAAAAAAATAAAAAQAAAAE=", "AAAAAAAAADRBZG1pbiBvbmx5OiBnaXZlIGEgc2hvcCBjcmVkaXQsIG9yIGNoYW5nZSBpdHMgbGltaXQuAAAACXNldF90ZXJtcwAAAAAAAAIAAAAAAAAABHNob3AAAAATAAAAAAAAAAVsaW1pdAAAAAAAAAsAAAABAAAD6QAAAAIAAAAD", "AAAAAAAAAF5UaGUgZHJpdmVyIHNheXMgInRoZSBzaG9wIGdhdmUgbWUgdGhpcyBtdWNoIGNhc2giLiBOb3RoaW5nIGNoYW5nZXMKdW50aWwgdGhlIHNob3AgY29uZmlybXMgaXQuAAAAAAAKY2FzaF9jbGFpbQAAAAAAAwAAAAAAAAAGZHJpdmVyAAAAAAATAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAAAAAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAfQAAAABkNvbmZpZwAA", "AAAAAAAAAAAAAAAKZ2V0X2xlbmRlcgAAAAAAAQAAAAAAAAAGbGVuZGVyAAAAAAATAAAAAQAAB9AAAAAKTGVuZGVyVmlldwAA", "AAAAAAAAAC1FdmVyeXRoaW5nIGV2ZXIgaW52b2ljZWQgYW5kIHBhaWQsIGJ5IG1ldGhvZC4AAAAAAAAKZ2V0X3RvdGFscwAAAAAAAAAAAAEAAAfQAAAABlRvdGFscwAA", "AAAAAAAAAINBbnlvbmUgKHVzdWFsbHkgdGhlIGxlbmRlciwgYXQgbGF1bmNoKSBjYW4gYWRkIG1vbmV5IHN0cmFpZ2h0IHRvIHRoZQpidWZmZXIsIHNvIGl0IGlzbid0IGVtcHR5IGJlZm9yZSB0aGUgZmlyc3QgY3JlZGl0IGZlZXMgYXJyaXZlLgAAAAALZnVuZF9idWZmZXIAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAAAM=", "AAAAAAAAAAAAAAALZ2V0X2ludm9pY2UAAAAAAQAAAAAAAAACaWQAAAAAAAYAAAABAAAD6QAAB9AAAAAHSW52b2ljZQAAAAAD", "AAAAAAAAAP9UaGUgc2hvcCBjb25maXJtcyB0aGUgZHJpdmVyJ3MgY2FzaCBjbGFpbSBvZiBleGFjdGx5IGBhbW91bnRgLCB0aGUKbnVtYmVyIGl0IHdhcyBzaG93bi4gSWYgdGhlIGRyaXZlciBjaGFuZ2VkIHRoZSBjbGFpbSBzaW5jZSwgbm90aGluZwpoYXBwZW5zIChgQ2xhaW1DaGFuZ2VkYCkuIFRoZSBkcml2ZXIgbm93IGhvbGRzIHRoYXQgY2FzaCBmb3IgdGhlCmRpc3RyaWJ1dG9yLCBhbmQgdGhlIGRpc3RyaWJ1dG9yIG93ZXMgdXMgdGhlIHVzYWdlIGZlZS4AAAAADGNhc2hfY29uZmlybQAAAAMAAAAAAAAABHNob3AAAAATAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAAAAAAAMZ2V0X3JlY291cnNlAAAAAQAAAAAAAAALZGlzdHJpYnV0b3IAAAAAEwAAAAEAAAfQAAAADFJlY291cnNlVmlldw==", "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAQAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAh0cmVhc3VyeQAAABMAAAAAAAAAEmNyZWRpdF9wZXJpb2Rfc2VjcwAAAAAABgAAAAA=", "AAAAAAAAARJBbnlvbmUgY2FuIGNhbGwgdGhpcyBvbmNlIGEgc2hvcCB0aGUgZGlzdHJpYnV0b3Igdm91Y2hlcyBmb3IgaXMgbW9yZQp0aGFuIGBNSU5PUl9MQVRFX0RBWVNgIGRheXMgbGF0ZSAoIzE4NSkuIFRoZSBkaXN0cmlidXRvcidzIGRlcG9zaXQgcGF5cwp0aGUgcG9vbCB0aGUgdm91Y2hlZCBwYXJ0LCBhbmQgdGhlIGRpc3RyaWJ1dG9yIGNvbGxlY3RzIGZyb20gdGhlIHNob3AKaXRzZWxmLiBJdCBjb3VudHMgYXMgYSBtYWpvciBsYXRlIHBheW1lbnQgb24gdGhlIHNob3AncyByZWNvcmQuAAAAAAANY2FsbF9yZWNvdXJzZQAAAAAAAAEAAAAAAAAABHNob3AAAAATAAAAAQAAA+kAAAALAAAAAw==", "AAAAAAAAAQNBbnlvbmUgY2FuIGNhbGwgdGhpcyBvbmNlIGEgc2hvcCBpcyBgREVGQVVMVF9BRlRFUl9QRVJJT0RTYCBjcmVkaXQKcGVyaW9kcyBsYXRlLCBzbyBsZW5kZXJzIGFyZSBuZXZlciBzdHVjayB3YWl0aW5nIG9uIHRoZSBhZG1pbi4gVGhlCmJ1ZmZlciBwYXlzIHRoZSBsZW5kZXJzIGJhY2sgd2hhdCBpdCBjYW4sIHRoZSBzaG9wJ3MgY3JlZGl0IGlzIHR1cm5lZApvZmYsIGFuZCB0aGUgZGVidCBzdGF5cyBvbiBpdHMgcmVjb3JkIGFzIGB3cml0dGVuX29mZmAuAAAAAA1jb3Zlcl9kZWZhdWx0AAAAAAAAAQAAAAAAAAAEc2hvcAAAABMAAAABAAAD6QAAAAIAAAAD", "AAAAAAAAAERIb3cgbWFueSBpbnZvaWNlcyBleGlzdC4gUG9zaXRpb25zIHJ1biBmcm9tIDAgKG9sZGVzdCkgdG8gY291bnQgLSAxLgAAAA1pbnZvaWNlX2NvdW50AAAAAAAAAAAAAAEAAAAE", "AAAAAAAAAC1UaGUgbmV3ZXN0IGBNQVhfTElTVGAgaW52b2ljZXMsIG9sZGVzdCBmaXJzdC4AAAAAAAANbGlzdF9pbnZvaWNlcwAAAAAAAAAAAAABAAAD6gAAB9AAAAAHSW52b2ljZQA=", "AAAAAAAAAIVBZG1pbiBvbmx5OiBsZXQgYSBsaWNlbnNlZCBsZW5kZXIgcHV0IG1vbmV5IGluIHRoZSBwb29sLiBMZW5kZXJzIGNhbgpiZSBhbnl3aGVyZSwgYXMgbG9uZyBhcyB0aGV5IGhvbGQgdGhlIHBvb2wncyBkb2xsYXJzIG9uIFN0ZWxsYXIuAAAAAAAADmFwcHJvdmVfbGVuZGVyAAAAAAABAAAAAAAAAAZsZW5kZXIAAAAAABMAAAAA", "AAAAAAAAAD1UaGUgZGlzdHJpYnV0b3IgZ290IGNhc2ggYmFjayBmcm9tIGEgZHJpdmVyIGF0IHRoZSB3YXJlaG91c2UuAAAAAAAADmNhc2hfaGFuZGVkX2luAAAAAAADAAAAAAAAAAtkaXN0cmlidXRvcgAAAAATAAAAAAAAAAZkcml2ZXIAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAAAM=", "AAAAAAAAAAAAAAAOY3JlYXRlX2ludm9pY2UAAAAAAAYAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAARzaG9wAAAAEwAAAAAAAAAGZHJpdmVyAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAA2R1ZQAAAAAGAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAAAAAAAOZ2V0X2Nhc2hfY2xhaW0AAAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAQAAAAs=", "AAAAAAAAAAAAAAAOZ2V0X3VzYWdlX293ZWQAAAAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAABAAAACw==", "AAAAAAAAAAAAAAAOaXNfZGlzdHJpYnV0b3IAAAAAAAEAAAAAAAAAC2Rpc3RyaWJ1dG9yAAAAABMAAAABAAAAAQ==", "AAAAAAAAAAAAAAAPZ2V0X2RyaXZlcl9jYXNoAAAAAAEAAAAAAAAABmRyaXZlcgAAAAAAEwAAAAEAAAAL", "AAAAAAAAAFpUaGUgcG9vbCBwYXlzIHRoZSByZXN0IG9mIHRoZSBpbnZvaWNlIG5vdzsgdGhlIHNob3Agb3dlcyBpdCBiYWNrCndpdGhpbiB0aGUgY3JlZGl0IHBlcmlvZC4AAAAAAA9wYXlfd2l0aF9jcmVkaXQAAAAAAgAAAAAAAAAEc2hvcAAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAADVBbiBhcHByb3ZlZCBkaXN0cmlidXRvciBhZGRzIHRvIGl0cyByZWNvdXJzZSBkZXBvc2l0LgAAAAAAABBkZXBvc2l0X3JlY291cnNlAAAAAgAAAAAAAAALZGlzdHJpYnV0b3IAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAGFUaGUgZGlzdHJpYnV0b3IgdGFrZXMgZGVwb3NpdCBiYWNrLCBhcyBsb25nIGFzIDIwJSBvZiBpdHMgdm91Y2hlZApjcmVkaXQgc3RpbGwgb3V0IHN0YXlzIGNvdmVyZWQuAAAAAAAAEXdpdGhkcmF3X3JlY291cnNlAAAAAAAAAgAAAAAAAAALZGlzdHJpYnV0b3IAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAAAw==", "AAAAAAAAAQpUaGUgZnVsbCBoaXN0b3J5LCBuZXdlc3QgZmlyc3QsIGEgcGFnZSBhdCBhIHRpbWU6IHVwIHRvIGBsaW1pdGAKKGF0IG1vc3QgYE1BWF9QQUdFYCkgaW52b2ljZXMgYXQgcG9zaXRpb25zIGJlZm9yZSBgYmVmb3JlYC4gU3RhcnQgd2l0aApgYmVmb3JlYCA9IGBpbnZvaWNlX2NvdW50KClgLCB0aGVuIHBhc3MgdGhlIG9sZGVzdCBwb3NpdGlvbiB5b3UgZ290CihgYmVmb3JlIC0gcGFnZSBsZW5ndGhgKSB0byBnZXQgdGhlIG5leHQgcGFnZS4gRW1wdHkgd2hlbiBkb25lLgAAAAAAEmxpc3RfaW52b2ljZXNfcGFnZQAAAAAAAgAAAAAAAAAGYmVmb3JlAAAAAAAEAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAHSW52b2ljZQA=", "AAAAAAAAAIZBZG1pbiBvbmx5OiBsZXQgYSBkaXN0cmlidXRvciBjcmVhdGUgaW52b2ljZXMuIFdpdGhvdXQgdGhpcywgYW55CmFkZHJlc3MgY291bGQgaW52b2ljZSBhIHNob3AgYW5kIGNvbGxlY3QgcG9vbCBtb25leSBhcyAiZGlzdHJpYnV0b3IiLgAAAAAAE2FwcHJvdmVfZGlzdHJpYnV0b3IAAAAAAQAAAAAAAAALZGlzdHJpYnV0b3IAAAAAEwAAAAA="]),
      options
    );
  }

   static deploy<T = Client>(args: { admin: string | Address; token: string | Address; treasury: string | Address; credit_period_secs: bigint }, options: MethodOptions & Omit<ContractClientOptions, 'contractId'> & { salt?: Uint8Array; address?: string; } & ({ wasmHash: Uint8Array | string; format?: "hex" | "base64"; externalRef?: never; } | { externalRef: ExternalExecutableRef; wasmHash?: never; format?: never; })): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(args, options);
  }
  public readonly fromJson = {
    pay : this.txFromJson<Result<null, Error>>,  repay : this.txFromJson<Result<null, Error>>,  vouch : this.txFromJson<Result<null, Error>>,  deposit : this.txFromJson<Result<null, Error>>,  get_pool : this.txFromJson<Pool>,  get_shop : this.txFromJson<ShopView>,  withdraw : this.txFromJson<Result<bigint, Error>>,  is_lender : this.txFromJson<boolean>,  set_terms : this.txFromJson<Result<null, Error>>,  cash_claim : this.txFromJson<Result<null, Error>>,  get_config : this.txFromJson<Config>,  get_lender : this.txFromJson<LenderView>,  get_totals : this.txFromJson<Totals>,  fund_buffer : this.txFromJson<Result<null, Error>>,  get_invoice : this.txFromJson<Result<Invoice, Error>>,  cash_confirm : this.txFromJson<Result<null, Error>>,  get_recourse : this.txFromJson<RecourseView>,  call_recourse : this.txFromJson<Result<bigint, Error>>,  cover_default : this.txFromJson<Result<null, Error>>,  invoice_count : this.txFromJson<number>,  list_invoices : this.txFromJson<Array<Invoice>>,  approve_lender : this.txFromJson<void>,  cash_handed_in : this.txFromJson<Result<null, Error>>,  create_invoice : this.txFromJson<Result<null, Error>>,  get_cash_claim : this.txFromJson<bigint>,  get_usage_owed : this.txFromJson<bigint>,  is_distributor : this.txFromJson<boolean>,  get_driver_cash : this.txFromJson<bigint>,  pay_with_credit : this.txFromJson<Result<null, Error>>,  deposit_recourse : this.txFromJson<Result<null, Error>>,  withdraw_recourse : this.txFromJson<Result<null, Error>>,  list_invoices_page : this.txFromJson<Array<Invoice>>,  approve_distributor : this.txFromJson<void>
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
   * Build a topics filter row for the "Vouched" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  vouchedEventFilter(topicValues?: { shop?: string | Address }): string[] {
    return this.spec.eventTopicFilter("Vouched", topicValues);
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
   * Build a topics filter row for the "Withdrawn" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  withdrawnEventFilter(topicValues?: { lender?: string | Address }): string[] {
    return this.spec.eventTopicFilter("Withdrawn", topicValues);
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
   * Build a topics filter row for the "LenderApproved" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  lenderApprovedEventFilter(topicValues?: { lender?: string | Address }): string[] {
    return this.spec.eventTopicFilter("LenderApproved", topicValues);
  }
  /**
   * Build a topics filter row for the "PaidWithCredit" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  paidWithCreditEventFilter(topicValues?: { id?: bigint }): string[] {
    return this.spec.eventTopicFilter("PaidWithCredit", topicValues);
  }
  /**
   * Build a topics filter row for the "RecourseCalled" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  recourseCalledEventFilter(topicValues?: { shop?: string | Address }): string[] {
    return this.spec.eventTopicFilter("RecourseCalled", topicValues);
  }
  /**
   * Build a topics filter row for the "RecourseDeposited" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  recourseDepositedEventFilter(topicValues?: { distributor?: string | Address }): string[] {
    return this.spec.eventTopicFilter("RecourseDeposited", topicValues);
  }
  /**
   * Build a topics filter row for the "RecourseWithdrawn" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  recourseWithdrawnEventFilter(topicValues?: { distributor?: string | Address }): string[] {
    return this.spec.eventTopicFilter("RecourseWithdrawn", topicValues);
  }
  /**
   * Build a topics filter row for the "DistributorApproved" event, for use in `Api.EventFilter.topics` when calling `server.getEvents`. Omitted fields match any value.
   */
  distributorApprovedEventFilter(topicValues?: { distributor?: string | Address }): string[] {
    return this.spec.eventTopicFilter("DistributorApproved", topicValues);
  }
}