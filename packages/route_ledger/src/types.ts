import {Address} from '@stellar/stellar-sdk';

    /**
 * The contract's token balance is always `available + buffer`.
 * Money lent to shops is counted again when they repay.
 */
export interface Pool {
  available: bigint;
  buffer: bigint;
  /**
   * Credit the pool has out with shops right now (what they still owe it).
   */
  lent: bigint;
  /**
   * Distributors' recourse deposits (#185). Not lenders' money: the
   * contract's token balance is `available + buffer + recourse`.
   */
  recourse: bigint;
  /**
   * Lender shares issued. Each share is worth (available + lent) / shares.
   */
  shares: bigint;
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
  15 : { message: "ClaimChanged" },
  /**
   * Only approved lenders can put money in the pool.
   */
  16 : { message: "NotLender" },
  /**
   * The lender asked for more shares than it holds.
   */
  17 : { message: "NotEnoughShares" },
  /**
   * The distributor's recourse deposit would drop below 20% of its vouched credit.
   */
  18 : { message: "NotEnoughDeposit" },
  /**
   * Who vouches for a shop can only change while it owes nothing.
   */
  19 : { message: "ShopOwes" }
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
 * Event: Vouched
 */
export interface VouchedEvent {
  name: "Vouched";
  data: {
    shop: string;
    distributor?: string;
    on?: boolean;
  };
}

/**
 * What the app shows. A shop with no credit terms gets all zeros.
 */
export interface ShopView {
  covered_by_distributor: bigint;
  due_at: bigint;
  first_credit_at: bigint;
  /**
   * Good cycles in a row; from `TRUSTED_CYCLES` the shop's credit costs its distributor less (#185).
   */
  good_cycles: number;
  late: number;
  late_major: number;
  late_minor: number;
  limit: bigint;
  max_days_late: number;
  on_time: number;
  overdue: boolean;
  owed: bigint;
  total_repaid: bigint;
  vouched_owed: bigint;
  voucher: string | null;
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
    shares?: bigint;
  };
}

/**
 * Event: Withdrawn
 */
export interface WithdrawnEvent {
  name: "Withdrawn";
  data: {
    lender: string;
    amount?: bigint;
    shares?: bigint;
  };
}

/**
 * What a lender sees: its shares, what they are worth now, and what it put in.
 */
export interface LenderView {
  approved: boolean;
  net_deposited: bigint;
  shares: bigint;
  value: bigint;
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
 * A distributor's recourse deposit and what it backs.
 */
export interface RecourseView {
  deposit: bigint;
  /**
   * The least the deposit can be: 20% of `vouched_out`, rounded up.
   */
  required: bigint;
  /**
   * Vouched credit that shops still owe the pool.
   */
  vouched_out: bigint;
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
 * Event: LenderApproved
 */
export interface LenderApprovedEvent {
  name: "LenderApproved";
  data: {
    lender: string;
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
    /**
     * True when the voucher's deposit backs it (the 0.25% recourse fee).
     */
    recourse?: boolean;
  };
}

/**
 * Event: RecourseCalled
 */
export interface RecourseCalledEvent {
  name: "RecourseCalled";
  data: {
    shop: string;
    distributor?: string;
    /**
     * What the deposit paid the pool.
     */
    paid?: bigint;
    /**
     * What the shop still owes the pool after that.
     */
    owed?: bigint;
  };
}

/**
 * Event: RecourseDeposited
 */
export interface RecourseDepositedEvent {
  name: "RecourseDeposited";
  data: {
    distributor: string;
    amount?: bigint;
  };
}

/**
 * Event: RecourseWithdrawn
 */
export interface RecourseWithdrawnEvent {
  name: "RecourseWithdrawn";
  data: {
    distributor: string;
    amount?: bigint;
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
    export type ContractEvent = RepaidEvent | VouchedEvent | TermsSetEvent | DepositedEvent | WithdrawnEvent | CashClaimedEvent | InvoicePaidEvent | BufferFundedEvent | CashHandedInEvent | CashConfirmedEvent | DefaultCoveredEvent | InvoiceCreatedEvent | LenderApprovedEvent | PaidWithCreditEvent | RecourseCalledEvent | RecourseDepositedEvent | RecourseWithdrawnEvent | DistributorApprovedEvent;
    