import {Address, xdr} from '@stellar/stellar-sdk';

    /**
 * The contract's token balance is always `available + buffer`.
 * Money lent to shops is counted again when they repay.
 */
export interface Pool {
  available: bigint;
  buffer: bigint;
}

/**
 * Struct: Shop
 */
export interface Shop {
  /**
   * Borrowed since `owed` was last 0.
   */
  cycle_borrowed: bigint;
  /**
   * True while every invoice credited this cycle had at least half paid
   * up front. Then the $40 minimum to grow the limit doesn't apply.
   */
  cycle_half_up_front: boolean;
  /**
   * Unix seconds; 0 while nothing is owed.
   */
  due_at: bigint;
  /**
   * Unix seconds of the shop's first credit; 0 if never.
   */
  first_credit_at: bigint;
  /**
   * Unix seconds of the last limit raise; 0 if never.
   */
  last_raise_at: bigint;
  late: number;
  late_major: number;
  /**
   * Repaid 2-7 days late / 8+ days late (`late` counts both, and defaults).
   */
  late_minor: number;
  limit: bigint;
  /**
   * The most days late the shop has ever repaid (or defaulted).
   */
  max_days_late: number;
  /**
   * Unix seconds; no limit raise before this (after a major late payment).
   */
  no_raise_until: bigint;
  on_time: number;
  owed: bigint;
  total_repaid: bigint;
  /**
   * Debt the buffer covered after a default and the shop still owes.
   */
  written_off: bigint;
}

/**
 * Error Enum: Error
 */
export const Error = {
  1 : { message: "AlreadyExists" },
  2 : { message: "NotFound" },
  3 : { message: "InvalidAmount" },
  4 : { message: "Overpay" },
  5 : { message: "AlreadyPaid" },
  6 : { message: "NotYourInvoice" },
  7 : { message: "Overdue" },
  8 : { message: "OverLimit" },
  9 : { message: "PoolTooLow" },
  10 : { message: "NothingOwed" },
  11 : { message: "NoCashClaim" },
  12 : { message: "NoCreditTerms" },
  13 : { message: "NotApproved" },
  14 : { message: "NotInDefault" },
  /**
   * The driver's cash claim isn't the amount the shop confirmed.
   */
  15 : { message: "ClaimChanged" }
}

/**
 * Struct: Config
 */
export interface Config {
  admin: string;
  credit_period_secs: bigint;
  token: string;
  treasury: string;
}

/**
 * Everything ever paid, by method, so the dashboard's totals cover the
 * whole history and not just the invoices it has loaded.
 */
export interface Totals {
  cash: bigint;
  credit: bigint;
  digital: bigint;
  invoiced: bigint;
  invoices: number;
}

/**
 * Event: Repaid
 */
export interface RepaidEvent {
  name: "Repaid";
  data: {
    shop: string;
    amount?: bigint;
    owed?: bigint;
  };
}

/**
 * Union: DataKey
 */
 export type DataKey =
  { tag: "Config"; values: void } |
  { tag: "Pool"; values: void } |
  { tag: "Totals"; values: void } |
  /**
   * Ids in creation order, `IDS_PER_CHUNK` per entry: chunk n holds
   * positions n*50 .. n*50+49. The count is `Totals.invoices`.
   */
  { tag: "IdChunk"; values: readonly [number] } |
  { tag: "Invoice"; values: readonly [bigint] } |
  { tag: "Shop"; values: readonly [string] } |
  { tag: "DriverCash"; values: readonly [string] } |
  { tag: "CashClaim"; values: readonly [bigint] } |
  { tag: "UsageOwed"; values: readonly [string] } |
  { tag: "Distributor"; values: readonly [string] };

/**
 * Struct: Invoice
 */
export interface Invoice {
  amount: bigint;
  /**
   * The credit fee the distributor paid on this invoice; 0 if no credit.
   */
  credit_fee: bigint;
  distributor: string;
  driver: string;
  /**
   * Unix seconds.
   */
  due: bigint;
  id: bigint;
  method: PayMethod;
  paid: bigint;
  shop: string;
  status: InvoiceStatus;
}

/**
 * What the app shows. A shop with no credit terms gets all zeros.
 */
export interface ShopView {
  due_at: bigint;
  first_credit_at: bigint;
  late: number;
  late_major: number;
  late_minor: number;
  limit: bigint;
  max_days_late: number;
  on_time: number;
  overdue: boolean;
  owed: bigint;
  total_repaid: bigint;
  written_off: bigint;
}

/**
 * Event: TermsSet
 */
export interface TermsSetEvent {
  name: "TermsSet";
  data: {
    shop: string;
    limit?: bigint;
  };
}

/**
 * Union: PayMethod
 */
 export type PayMethod =
  { tag: "None"; values: void } |
  { tag: "Digital"; values: void } |
  { tag: "Cash"; values: void } |
  { tag: "Credit"; values: void } |
  { tag: "Mixed"; values: void };

/**
 * Event: Deposited
 */
export interface DepositedEvent {
  name: "Deposited";
  data: {
    lender: string;
    amount?: bigint;
  };
}

/**
 * Event: CashClaimed
 */
export interface CashClaimedEvent {
  name: "CashClaimed";
  data: {
    id: bigint;
    driver?: string;
    amount?: bigint;
  };
}

/**
 * Event: InvoicePaid
 */
export interface InvoicePaidEvent {
  name: "InvoicePaid";
  data: {
    id: bigint;
    shop?: string;
    amount?: bigint;
    usage_fee?: bigint;
  };
}

/**
 * Event: BufferFunded
 */
export interface BufferFundedEvent {
  name: "BufferFunded";
  data: {
    from: string;
    amount?: bigint;
  };
}

/**
 * Event: CashHandedIn
 */
export interface CashHandedInEvent {
  name: "CashHandedIn";
  data: {
    driver: string;
    distributor?: string;
    amount?: bigint;
  };
}

/**
 * Union: InvoiceStatus
 */
 export type InvoiceStatus =
  { tag: "Due"; values: void } |
  { tag: "PartPaid"; values: void } |
  { tag: "Paid"; values: void };

/**
 * Event: CashConfirmed
 */
export interface CashConfirmedEvent {
  name: "CashConfirmed";
  data: {
    id: bigint;
    shop?: string;
    driver?: string;
    amount?: bigint;
  };
}

/**
 * Event: DefaultCovered
 */
export interface DefaultCoveredEvent {
  name: "DefaultCovered";
  data: {
    shop: string;
    owed?: bigint;
    /**
     * How much the buffer could pay back to the lenders (at most `owed`).
     */
    covered?: bigint;
  };
}

/**
 * Event: InvoiceCreated
 */
export interface InvoiceCreatedEvent {
  name: "InvoiceCreated";
  data: {
    id: bigint;
    distributor?: string;
    shop?: string;
    amount?: bigint;
    due?: bigint;
  };
}

/**
 * Event: PaidWithCredit
 */
export interface PaidWithCreditEvent {
  name: "PaidWithCredit";
  data: {
    id: bigint;
    shop?: string;
    amount?: bigint;
    payout?: bigint;
    due_at?: bigint;
  };
}

/**
 * Event: DistributorApproved
 */
export interface DistributorApprovedEvent {
  name: "DistributorApproved";
  data: {
    distributor: string;
  };
}

/**
 * Contract executable used for creating a new contract and used in
 * `CreateContractHostFnContext`.
 */
 export type ContractExecutable =
  /**
   * Executable specified by the contract instance as a specific Wasm contract code entry identified by its Wasm sha256 hash.
   */
  { tag: "Wasm"; values: readonly [Uint8Array] } |
  /**
   * Executable reference via a persistent storage entry owned by this contract or another contract.
   */
  { tag: "ExternalRef"; values: readonly [ContractExecutableRef] };

/**
 * Executable referenced via a persistent storage entry owned by a contract,
 * either this contract or another contract.
 *
 * The persistent storage entry owned by the `owner` has the `tag` as its key.
 */
export interface ContractExecutableRef {
  owner: string;
  tag: string;
}

/**
 * Context of a single authorized call performed by an address.
 *
 * Custom account contracts that implement `__check_auth` special function
 * receive a list of `Context` values corresponding to all the calls that
 * need to be authorized.
 */
 export type Context =
  /**
   * Contract invocation.
   */
  { tag: "Contract"; values: readonly [ContractContext] } |
  /**
   * Contract that has a constructor with no arguments is created.
   */
  { tag: "CreateContractHostFn"; values: readonly [CreateContractHostFnContext] } |
  /**
   * Contract that has a constructor with 1 or more arguments is created.
   */
  { tag: "CreateContractWithCtorHostFn"; values: readonly [CreateContractWithConstructorHostFnContext] };

/**
 * Authorization context of a single contract call.
 *
 * This struct corresponds to a `require_auth_for_args` call for an address
 * from `contract` function with `fn_name` name and `args` arguments.
 */
export interface ContractContext {
  args: Array<any>;
  contract: string;
  fn_name: string;
}

/**
 * Value of contract node in InvokerContractAuthEntry tree.
 */
export interface SubContractInvocation {
  context: ContractContext;
  sub_invocations: Array<InvokerContractAuthEntry>;
}

/**
 * A node in the tree of authorizations performed on behalf of the current
 * contract as invoker of the contracts deeper in the call stack.
 *
 * This is used as an argument of `authorize_as_current_contract` host function.
 *
 * This tree corresponds `require_auth[_for_args]` calls on behalf of the
 * current contract.
 */
 export type InvokerContractAuthEntry =
  /**
   * Invoke a contract.
   */
  { tag: "Contract"; values: readonly [SubContractInvocation] } |
  /**
   * Create a contract passing 0 arguments to constructor.
   */
  { tag: "CreateContractHostFn"; values: readonly [CreateContractHostFnContext] } |
  /**
   * Create a contract passing 0 or more arguments to constructor.
   */
  { tag: "CreateContractWithCtorHostFn"; values: readonly [CreateContractWithConstructorHostFnContext] };

/**
 * Authorization context for `create_contract` host function that creates a
 * new contract on behalf of authorizer address.
 */
export interface CreateContractHostFnContext {
  executable: ContractExecutable;
  salt: Uint8Array;
}

/**
 * Authorization context for `create_contract` host function that creates a
 * new contract on behalf of authorizer address.
 * This is the same as `CreateContractHostFnContext`, but also has
 * contract constructor arguments.
 */
export interface CreateContractWithConstructorHostFnContext {
  constructor_args: Array<any>;
  executable: ContractExecutable;
  salt: Uint8Array;
}

/**
 * Union: Executable
 */
 export type Executable =
  { tag: "Wasm"; values: readonly [Uint8Array] } |
  { tag: "StellarAsset"; values: void } |
  { tag: "Account"; values: void };
    export type ContractEvent = RepaidEvent | TermsSetEvent | DepositedEvent | CashClaimedEvent | InvoicePaidEvent | BufferFundedEvent | CashHandedInEvent | CashConfirmedEvent | DefaultCoveredEvent | InvoiceCreatedEvent | PaidWithCreditEvent | DistributorApprovedEvent;
    