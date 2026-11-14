#![no_std]
//! route_ledger: a distributor's invoices to tiendas (small shops).
//!
//! A shop pays an invoice in one of three ways:
//! - digital: `pay`, straight from the shop's wallet;
//! - cash: the driver records it (`cash_claim`) and the shop confirms it (`cash_confirm`);
//! - credit: `pay_with_credit`, the lender pool pays now and the shop `repay`s later.
//!
//! Money is our test USDC with 7 decimals: $1 = 10_000_000 units.
//! Fees are in basis points (1 bps = 0.01%) and round down.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
    IntoVal, Val, Vec,
};

/// 0.10% on every invoice paid digitally or in cash. Goes to us.
/// Credit sales don't pay it: our cut there is inside the 1.50% credit fee,
/// so the distributor sees one number ($98.50 for every $100).
pub const USAGE_FEE_BPS: i128 = 10;
/// The credit fee slides with how much of the invoice goes on credit (#135):
/// 1.50% when all of it does, down to 1.00% when the shop paid 90% up front.
/// See `credit_fee_bps`. It is split three ways:
pub const CREDIT_FEE_BPS: i128 = 150;
/// The lowest rate, reached when 10% or less of the invoice goes on credit.
pub const MIN_CREDIT_FEE_BPS: i128 = 100;
/// The lenders' return is always 0.50% (it stays in `available`).
/// What's left of the rate splits 3:1 buffer : us, rounding to the buffer:
/// at 1.50% that is 0.75% buffer and 0.25% us, at 1.00% it is 0.38% and 0.12%.
pub const LENDER_BPS: i128 = 50;

/// Each on-time repayment raises the shop's limit by $25...
pub const LIMIT_STEP: i128 = 250_000_000;
/// ...up to $500. This is our own credit record.
pub const LIMIT_CAP: i128 = 5_000_000_000;
/// A repayment only raises the limit if the shop borrowed at least $40 in
/// that cycle (about one small delivery), unless it paid at least half of
/// every credited invoice up front (#135)...
pub const MIN_BORROW_TO_GROW: i128 = 400_000_000;
/// The half-up-front waiver still needs $10 on credit in the cycle, so a $1
/// invoice paid half up front can't farm the limit (Jack's review of #139).
pub const MIN_BORROW_WITH_HALF: i128 = 100_000_000;
// ...and at most once per credit period. Together these stop a shop from
// taking $1 of credit and repaying it over and over to reach $500.

/// Lateness is graded in "days" past `due_at` (#137). A day is a seventh of
/// the credit period, so the 2-minute demo period still has all the bands.
/// Up to this many days late still counts as on time (a grace day).
pub const GRACE_DAYS: u64 = 1;
/// Up to this many days late is a minor late payment: the limit drops $25.
pub const MINOR_LATE_DAYS: u64 = 7;
/// Later than that is a major one: the limit drops $50 and doesn't grow
/// again for `NO_RAISE_PERIODS` credit periods.
pub const MAJOR_LATE_STEP: i128 = 500_000_000;
pub const NO_RAISE_PERIODS: u64 = 4;

/// A shop this many credit periods past its due date can be written off:
/// 4 x 7 days = 28 days late for real, 8 minutes with the 2-minute demo period.
pub const DEFAULT_AFTER_PERIODS: u64 = 4;

/// `list_invoices` returns only the newest 60, so one call never reads too much.
/// Older invoices are read a page at a time with `list_invoices_page`.
pub const MAX_LIST: u32 = 60;
/// Largest page `list_invoices_page` returns. A contract call can only read
/// about 100 storage entries, and each invoice is one.
pub const MAX_PAGE: u32 = 30;
/// Invoice ids are stored in order, this many per storage entry, so the
/// index never becomes one huge entry and a page reads at most 3 of them.
pub const IDS_PER_CHUNK: u32 = 50;

const DAY_IN_LEDGERS: u32 = 17_280; // one ledger every ~5 seconds
const TTL_EXTEND_TO: u32 = 30 * DAY_IN_LEDGERS;
const TTL_THRESHOLD: u32 = TTL_EXTEND_TO - DAY_IN_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyExists = 1,
    NotFound = 2,
    InvalidAmount = 3,
    Overpay = 4,
    AlreadyPaid = 5,
    NotYourInvoice = 6,
    Overdue = 7,
    OverLimit = 8,
    PoolTooLow = 9,
    NothingOwed = 10,
    NoCashClaim = 11,
    NoCreditTerms = 12,
    NotApproved = 13,
    NotInDefault = 14,
    /// The driver's cash claim isn't the amount the shop confirmed.
    ClaimChanged = 15,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum InvoiceStatus {
    Due,
    PartPaid,
    Paid,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PayMethod {
    None,
    Digital,
    Cash,
    Credit,
    Mixed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invoice {
    pub id: u64,
    pub distributor: Address,
    pub shop: Address,
    pub driver: Address,
    pub amount: i128,
    pub paid: i128,
    /// Unix seconds.
    pub due: u64,
    pub status: InvoiceStatus,
    pub method: PayMethod,
    /// The credit fee the distributor paid on this invoice; 0 if no credit.
    pub credit_fee: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub token: Address,
    pub treasury: Address,
    pub credit_period_secs: u64,
}

/// The contract's token balance is always `available + buffer`.
/// Money lent to shops is counted again when they repay.
#[contracttype]
#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct Pool {
    pub available: i128,
    pub buffer: i128,
}

#[contracttype]
#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct Shop {
    pub limit: i128,
    pub owed: i128,
    /// Unix seconds; 0 while nothing is owed.
    pub due_at: u64,
    pub on_time: u32,
    pub late: u32,
    pub total_repaid: i128,
    /// Borrowed since `owed` was last 0.
    pub cycle_borrowed: i128,
    /// Unix seconds of the last limit raise; 0 if never.
    pub last_raise_at: u64,
    /// Debt the buffer covered after a default and the shop still owes.
    pub written_off: i128,
    /// True while every invoice credited this cycle had at least half paid
    /// up front. Then the $40 minimum to grow the limit doesn't apply.
    pub cycle_half_up_front: bool,
    /// Repaid 2-7 days late / 8+ days late (`late` counts both, and defaults).
    pub late_minor: u32,
    pub late_major: u32,
    /// The most days late the shop has ever repaid (or defaulted).
    pub max_days_late: u32,
    /// Unix seconds of the shop's first credit; 0 if never.
    pub first_credit_at: u64,
    /// Unix seconds; no limit raise before this (after a major late payment).
    pub no_raise_until: u64,
}

/// Everything ever paid, by method, so the dashboard's totals cover the
/// whole history and not just the invoices it has loaded.
#[contracttype]
#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct Totals {
    pub invoices: u32,
    pub invoiced: i128,
    pub digital: i128,
    pub cash: i128,
    pub credit: i128,
}

/// What the app shows. A shop with no credit terms gets all zeros.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ShopView {
    pub limit: i128,
    pub owed: i128,
    pub due_at: u64,
    pub overdue: bool,
    pub on_time: u32,
    pub late: u32,
    pub total_repaid: i128,
    pub written_off: i128,
    pub late_minor: u32,
    pub late_major: u32,
    pub max_days_late: u32,
    pub first_credit_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    Pool,
    Totals,
    /// Ids in creation order, `IDS_PER_CHUNK` per entry: chunk n holds
    /// positions n*50 .. n*50+49. The count is `Totals.invoices`.
    IdChunk(u32),
    Invoice(u64),
    Shop(Address),
    DriverCash(Address),
    CashClaim(u64),
    UsageOwed(Address),
    Distributor(Address),
}

#[contractevent]
pub struct InvoiceCreated {
    #[topic]
    pub id: u64,
    pub distributor: Address,
    pub shop: Address,
    pub amount: i128,
    pub due: u64,
}

#[contractevent]
pub struct InvoicePaid {
    #[topic]
    pub id: u64,
    pub shop: Address,
    pub amount: i128,
    pub usage_fee: i128,
}

#[contractevent]
pub struct CashClaimed {
    #[topic]
    pub id: u64,
    pub driver: Address,
    pub amount: i128,
}

#[contractevent]
pub struct CashConfirmed {
    #[topic]
    pub id: u64,
    pub shop: Address,
    pub driver: Address,
    pub amount: i128,
}

#[contractevent]
pub struct CashHandedIn {
    #[topic]
    pub driver: Address,
    pub distributor: Address,
    pub amount: i128,
}

#[contractevent]
pub struct Deposited {
    #[topic]
    pub lender: Address,
    pub amount: i128,
}

#[contractevent]
pub struct TermsSet {
    #[topic]
    pub shop: Address,
    pub limit: i128,
}

#[contractevent]
pub struct PaidWithCredit {
    #[topic]
    pub id: u64,
    pub shop: Address,
    pub amount: i128,
    pub payout: i128,
    pub due_at: u64,
}

#[contractevent]
pub struct Repaid {
    #[topic]
    pub shop: Address,
    pub amount: i128,
    pub owed: i128,
}

#[contractevent]
pub struct DistributorApproved {
    #[topic]
    pub distributor: Address,
}

#[contractevent]
pub struct BufferFunded {
    #[topic]
    pub from: Address,
    pub amount: i128,
}

#[contractevent]
pub struct DefaultCovered {
    #[topic]
    pub shop: Address,
    pub owed: i128,
    /// How much the buffer could pay back to the lenders (at most `owed`).
    pub covered: i128,
}

#[contract]
pub struct RouteLedger;

#[contractimpl]
impl RouteLedger {
    pub fn __constructor(
        env: Env,
        admin: Address,
        token: Address,
        treasury: Address,
        credit_period_secs: u64,
    ) {
        let config = Config { admin, token, treasury, credit_period_secs };
        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::Pool, &Pool::default());
        env.storage().instance().set(&DataKey::Totals, &Totals::default());
    }

    // ---------- v1: invoices and digital payments ----------

    /// Admin only: let a distributor create invoices. Without this, any
    /// address could invoice a shop and collect pool money as "distributor".
    pub fn approve_distributor(env: Env, distributor: Address) {
        load_config(&env).admin.require_auth();
        put(&env, &DataKey::Distributor(distributor.clone()), &true);
        DistributorApproved { distributor }.publish(&env);
    }

    pub fn is_distributor(env: Env, distributor: Address) -> bool {
        is_approved(&env, &distributor)
    }

    pub fn create_invoice(
        env: Env,
        distributor: Address,
        id: u64,
        shop: Address,
        driver: Address,
        amount: i128,
        due: u64,
    ) -> Result<(), Error> {
        distributor.require_auth();
        if !is_approved(&env, &distributor) {
            return Err(Error::NotApproved);
        }
        if env.storage().persistent().has(&DataKey::Invoice(id)) {
            return Err(Error::AlreadyExists);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let invoice = Invoice {
            id,
            distributor: distributor.clone(),
            shop: shop.clone(),
            driver,
            amount,
            paid: 0,
            due,
            status: InvoiceStatus::Due,
            method: PayMethod::None,
            credit_fee: 0,
        };
        put(&env, &DataKey::Invoice(id), &invoice);
        let mut totals = load_totals(&env);
        let chunk_key = DataKey::IdChunk(totals.invoices / IDS_PER_CHUNK);
        let mut chunk: Vec<u64> =
            env.storage().persistent().get(&chunk_key).unwrap_or_else(|| Vec::new(&env));
        chunk.push_back(id);
        put(&env, &chunk_key, &chunk);
        totals.invoices += 1;
        // Totals are for display: they saturate rather than ever block a call.
        totals.invoiced = totals.invoiced.saturating_add(amount);
        save_totals(&env, &totals);
        InvoiceCreated { id, distributor, shop, amount, due }.publish(&env);
        Ok(())
    }

    pub fn pay(env: Env, shop: Address, id: u64, amount: i128) -> Result<(), Error> {
        shop.require_auth();
        let mut invoice = load_invoice(&env, id)?;
        if invoice.shop != shop {
            return Err(Error::NotYourInvoice);
        }
        if invoice.status == InvoiceStatus::Paid {
            return Err(Error::AlreadyPaid);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if amount > invoice.amount - invoice.paid {
            return Err(Error::Overpay);
        }

        let config = load_config(&env);
        let usage_fee = bps(amount, USAGE_FEE_BPS)?;
        let token = token::Client::new(&env, &config.token);
        send(&token, &shop, &invoice.distributor, amount - usage_fee);
        send(&token, &shop, &config.treasury, usage_fee);

        invoice.paid += amount;
        record_payment(&env, &mut invoice, PayMethod::Digital, amount);
        InvoicePaid { id, shop, amount, usage_fee }.publish(&env);
        Ok(())
    }

    pub fn get_invoice(env: Env, id: u64) -> Result<Invoice, Error> {
        load_invoice(&env, id)
    }

    /// The newest `MAX_LIST` invoices, oldest first.
    pub fn list_invoices(env: Env) -> Vec<Invoice> {
        let count = load_totals(&env).invoices;
        let mut invoices = Vec::new(&env);
        for position in count.saturating_sub(MAX_LIST)..count {
            if let Some(invoice) = invoice_at(&env, position) {
                invoices.push_back(invoice);
            }
        }
        invoices
    }

    /// How many invoices exist. Positions run from 0 (oldest) to count - 1.
    pub fn invoice_count(env: Env) -> u32 {
        load_totals(&env).invoices
    }

    /// The full history, newest first, a page at a time: up to `limit`
    /// (at most `MAX_PAGE`) invoices at positions before `before`. Start with
    /// `before` = `invoice_count()`, then pass the oldest position you got
    /// (`before - page length`) to get the next page. Empty when done.
    pub fn list_invoices_page(env: Env, before: u32, limit: u32) -> Vec<Invoice> {
        let end = before.min(load_totals(&env).invoices);
        let start = end.saturating_sub(limit.min(MAX_PAGE));
        let mut invoices = Vec::new(&env);
        for position in (start..end).rev() {
            if let Some(invoice) = invoice_at(&env, position) {
                invoices.push_back(invoice);
            }
        }
        invoices
    }

    /// Everything ever invoiced and paid, by method.
    pub fn get_totals(env: Env) -> Totals {
        load_totals(&env)
    }

    pub fn get_config(env: Env) -> Config {
        load_config(&env)
    }

    // ---------- v2: cash, the lender pool and credit ----------

    /// The driver says "the shop gave me this much cash". Nothing changes
    /// until the shop confirms it.
    pub fn cash_claim(env: Env, driver: Address, id: u64, amount: i128) -> Result<(), Error> {
        driver.require_auth();
        let invoice = load_invoice(&env, id)?;
        if invoice.driver != driver {
            return Err(Error::NotYourInvoice);
        }
        if invoice.status == InvoiceStatus::Paid {
            return Err(Error::AlreadyPaid);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if amount > invoice.amount - invoice.paid {
            return Err(Error::Overpay);
        }
        put(&env, &DataKey::CashClaim(id), &amount);
        CashClaimed { id, driver, amount }.publish(&env);
        Ok(())
    }

    /// The shop confirms the driver's cash claim of exactly `amount`, the
    /// number it was shown. If the driver changed the claim since, nothing
    /// happens (`ClaimChanged`). The driver now holds that cash for the
    /// distributor, and the distributor owes us the usage fee.
    pub fn cash_confirm(env: Env, shop: Address, id: u64, amount: i128) -> Result<(), Error> {
        shop.require_auth();
        let mut invoice = load_invoice(&env, id)?;
        if invoice.shop != shop {
            return Err(Error::NotYourInvoice);
        }
        let claim_key = DataKey::CashClaim(id);
        let claim: i128 = env.storage().persistent().get(&claim_key).ok_or(Error::NoCashClaim)?;
        if claim != amount {
            return Err(Error::ClaimChanged);
        }
        // The invoice may have been paid another way since the claim.
        if invoice.status == InvoiceStatus::Paid {
            return Err(Error::AlreadyPaid);
        }
        if claim > invoice.amount - invoice.paid {
            return Err(Error::Overpay);
        }

        invoice.paid += claim;
        record_payment(&env, &mut invoice, PayMethod::Cash, claim);
        add(&env, DataKey::DriverCash(invoice.driver.clone()), claim);
        add(&env, DataKey::UsageOwed(invoice.distributor.clone()), bps(claim, USAGE_FEE_BPS)?);
        env.storage().persistent().remove(&claim_key);
        CashConfirmed { id, shop, driver: invoice.driver, amount: claim }.publish(&env);
        Ok(())
    }

    /// The distributor got cash back from a driver at the warehouse.
    pub fn cash_handed_in(
        env: Env,
        distributor: Address,
        driver: Address,
        amount: i128,
    ) -> Result<(), Error> {
        distributor.require_auth();
        // Without this, any address could sign here and zero a driver's cash total.
        // Still open: an approved distributor can lower any driver's total, because
        // the contract doesn't record which distributor a driver works for.
        if !is_approved(&env, &distributor) {
            return Err(Error::NotApproved);
        }
        let key = DataKey::DriverCash(driver.clone());
        let held: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if amount <= 0 || amount > held {
            return Err(Error::InvalidAmount);
        }
        put(&env, &key, &(held - amount));
        CashHandedIn { driver, distributor, amount }.publish(&env);
        Ok(())
    }

    /// A lender adds money to the pool that pays invoices on credit.
    pub fn deposit(env: Env, lender: Address, amount: i128) -> Result<(), Error> {
        lender.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let config = load_config(&env);
        token::Client::new(&env, &config.token).transfer(
            &lender,
            &env.current_contract_address(),
            &amount,
        );
        let mut pool = load_pool(&env);
        pool.available += amount;
        save_pool(&env, &pool);
        Deposited { lender, amount }.publish(&env);
        Ok(())
    }

    /// Admin only: give a shop credit, or change its limit.
    pub fn set_terms(env: Env, shop: Address, limit: i128) -> Result<(), Error> {
        load_config(&env).admin.require_auth();
        if limit < 0 {
            return Err(Error::InvalidAmount);
        }
        let mut terms = load_shop(&env, &shop).unwrap_or_default();
        terms.limit = limit;
        save_shop(&env, &shop, &terms);
        TermsSet { shop, limit }.publish(&env);
        Ok(())
    }

    /// The pool pays the rest of the invoice now; the shop owes it back
    /// within the credit period.
    pub fn pay_with_credit(env: Env, shop: Address, id: u64) -> Result<(), Error> {
        shop.require_auth();
        let mut invoice = load_invoice(&env, id)?;
        if invoice.shop != shop {
            return Err(Error::NotYourInvoice);
        }
        if invoice.status == InvoiceStatus::Paid {
            return Err(Error::AlreadyPaid);
        }
        let mut terms = load_shop(&env, &shop).ok_or(Error::NoCreditTerms)?;
        let now = env.ledger().timestamp();

        // 1. No new credit while an older balance is late.
        if terms.owed > 0 && now > terms.due_at {
            return Err(Error::Overdue);
        }
        // 2. Never past the shop's limit. A sum too big to fit is past any limit.
        let amount = invoice.amount - invoice.paid;
        match terms.owed.checked_add(amount) {
            Some(total) if total <= terms.limit => {}
            _ => return Err(Error::OverLimit),
        }
        // 3. Fees: the distributor gets the amount minus the credit fee, 1.00%
        //    to 1.50% depending on how much the shop paid up front (no usage
        //    fee on credit: our cut is inside the credit fee).
        let rate = credit_fee_bps(amount, invoice.amount);
        let (to_buffer_bps, our_bps) = fee_split(rate);
        let payout = amount - bps(amount, rate)?;
        let ours = bps(amount, our_bps)?;
        let to_buffer = bps(amount, to_buffer_bps)?;
        // The lenders' 0.50% never leaves `available`, so the pool gives up the rest.
        let from_pool = payout + ours + to_buffer;
        // 4. Only lend money the pool has, never the buffer.
        let mut pool = load_pool(&env);
        if pool.available < from_pool {
            return Err(Error::PoolTooLow);
        }

        let config = load_config(&env);
        let token = token::Client::new(&env, &config.token);
        let me = env.current_contract_address();
        send(&token, &me, &invoice.distributor, payout);
        send(&token, &me, &config.treasury, ours);

        pool.available -= from_pool;
        pool.buffer += to_buffer;
        save_pool(&env, &pool);

        if terms.owed == 0 {
            terms.due_at = now + config.credit_period_secs;
            terms.cycle_borrowed = 0;
            terms.cycle_half_up_front = true;
        }
        if terms.first_credit_at == 0 {
            terms.first_credit_at = now;
        }
        // At least half paid up front, on every credited invoice this cycle.
        terms.cycle_half_up_front &= invoice.paid.saturating_mul(2) >= invoice.amount;
        terms.owed += amount;
        terms.cycle_borrowed += amount;
        save_shop(&env, &shop, &terms);

        invoice.paid = invoice.amount;
        invoice.credit_fee = amount - payout;
        record_payment(&env, &mut invoice, PayMethod::Credit, amount);
        PaidWithCredit { id, shop, amount, payout, due_at: terms.due_at }.publish(&env);
        Ok(())
    }

    pub fn get_pool(env: Env) -> Pool {
        load_pool(&env)
    }

    pub fn get_driver_cash(env: Env, driver: Address) -> i128 {
        env.storage().persistent().get(&DataKey::DriverCash(driver)).unwrap_or(0)
    }

    pub fn get_usage_owed(env: Env, distributor: Address) -> i128 {
        env.storage().persistent().get(&DataKey::UsageOwed(distributor)).unwrap_or(0)
    }

    pub fn get_cash_claim(env: Env, id: u64) -> i128 {
        env.storage().persistent().get(&DataKey::CashClaim(id)).unwrap_or(0)
    }

    // ---------- v3: repayment and the shop's credit record ----------

    /// The shop pays back credit. Money goes to the pool for the lenders.
    /// If the debt was written off (`cover_default`), it refills the buffer instead.
    pub fn repay(env: Env, shop: Address, amount: i128) -> Result<(), Error> {
        shop.require_auth();
        let mut terms = match load_shop(&env, &shop) {
            Some(terms) if terms.owed > 0 || terms.written_off > 0 => terms,
            _ => return Err(Error::NothingOwed),
        };
        let owed_now = if terms.owed > 0 { terms.owed } else { terms.written_off };
        if amount <= 0 || amount > owed_now {
            return Err(Error::InvalidAmount);
        }

        let config = load_config(&env);
        token::Client::new(&env, &config.token).transfer(
            &shop,
            &env.current_contract_address(),
            &amount,
        );
        let mut pool = load_pool(&env);
        terms.total_repaid += amount;

        if terms.owed == 0 {
            // Paying back a written-off debt: the buffer paid for it, so it gets it back.
            pool.buffer += amount;
            save_pool(&env, &pool);
            terms.written_off -= amount;
            save_shop(&env, &shop, &terms);
            Repaid { shop, amount, owed: terms.written_off }.publish(&env);
            return Ok(());
        }

        pool.available += amount;
        save_pool(&env, &pool);
        terms.owed -= amount;
        if terms.owed == 0 {
            let now = env.ledger().timestamp();
            let period = config.credit_period_secs;
            let days = days_late(now, terms.due_at, period);
            terms.max_days_late = terms.max_days_late.max(days_u32(days));
            if days <= GRACE_DAYS {
                terms.on_time += 1;
                // +$25 for paying on time, never past $500, and only if the shop
                // borrowed at least $40 this cycle (or $10, with half of every credited
                // invoice paid up front), wasn't raised in the last credit period, and
                // isn't serving a no-raise after a major late payment. A limit the
                // admin set above $500 is left alone.
                let big_enough = terms.cycle_borrowed >= MIN_BORROW_TO_GROW
                    || (terms.cycle_half_up_front && terms.cycle_borrowed >= MIN_BORROW_WITH_HALF);
                let waited =
                    terms.last_raise_at == 0 || now >= terms.last_raise_at + period;
                if big_enough && waited && now >= terms.no_raise_until && terms.limit < LIMIT_CAP {
                    terms.limit = (terms.limit + LIMIT_STEP).min(LIMIT_CAP);
                    terms.last_raise_at = now;
                }
            } else if days <= MINOR_LATE_DAYS {
                // 2-7 days late: the limit drops $25.
                terms.late += 1;
                terms.late_minor += 1;
                terms.limit = (terms.limit - LIMIT_STEP).max(0);
            } else {
                // 8+ days late: the limit drops $50 and can't grow for 4 periods.
                terms.late += 1;
                terms.late_major += 1;
                terms.limit = (terms.limit - MAJOR_LATE_STEP).max(0);
                terms.no_raise_until =
                    now.saturating_add(period.saturating_mul(NO_RAISE_PERIODS));
            }
            terms.due_at = 0;
            terms.cycle_borrowed = 0;
            terms.cycle_half_up_front = false;
        }
        save_shop(&env, &shop, &terms);
        Repaid { shop, amount, owed: terms.owed }.publish(&env);
        Ok(())
    }

    /// Admin only: a shop is `DEFAULT_AFTER_PERIODS` credit periods late.
    /// The buffer pays the lenders back what it can, the shop's credit is
    /// turned off, and the debt stays on its record as `written_off`.
    pub fn cover_default(env: Env, shop: Address) -> Result<(), Error> {
        let config = load_config(&env);
        config.admin.require_auth();
        let mut terms = load_shop(&env, &shop).ok_or(Error::NothingOwed)?;
        if terms.owed == 0 {
            return Err(Error::NothingOwed);
        }
        let late_by = config.credit_period_secs.saturating_mul(DEFAULT_AFTER_PERIODS);
        if env.ledger().timestamp() <= terms.due_at.saturating_add(late_by) {
            return Err(Error::NotInDefault);
        }

        let owed = terms.owed;
        let mut pool = load_pool(&env);
        let covered = owed.min(pool.buffer);
        pool.buffer -= covered;
        pool.available += covered;
        save_pool(&env, &pool);

        let days = days_late(env.ledger().timestamp(), terms.due_at, config.credit_period_secs);
        terms.max_days_late = terms.max_days_late.max(days_u32(days));
        terms.written_off += owed;
        terms.owed = 0;
        terms.due_at = 0;
        terms.cycle_borrowed = 0;
        terms.cycle_half_up_front = false;
        terms.late += 1;
        terms.limit = 0;
        save_shop(&env, &shop, &terms);
        DefaultCovered { shop, owed, covered }.publish(&env);
        Ok(())
    }

    /// Anyone (usually the lender, at launch) can add money straight to the
    /// buffer, so it isn't empty before the first credit fees arrive.
    pub fn fund_buffer(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let config = load_config(&env);
        token::Client::new(&env, &config.token).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );
        let mut pool = load_pool(&env);
        pool.buffer += amount;
        save_pool(&env, &pool);
        BufferFunded { from, amount }.publish(&env);
        Ok(())
    }

    pub fn get_shop(env: Env, shop: Address) -> ShopView {
        let terms = load_shop(&env, &shop).unwrap_or_default();
        ShopView {
            overdue: terms.owed > 0 && env.ledger().timestamp() > terms.due_at,
            limit: terms.limit,
            owed: terms.owed,
            due_at: terms.due_at,
            on_time: terms.on_time,
            late: terms.late,
            total_repaid: terms.total_repaid,
            written_off: terms.written_off,
            late_minor: terms.late_minor,
            late_major: terms.late_major,
            max_days_late: terms.max_days_late,
            first_credit_at: terms.first_credit_at,
        }
    }
}

// ---------- helpers ----------

/// `amount * bps / 10_000`, rounded down.
/// The credit fee in bps when `credited` of an invoice of `total` goes on
/// credit (#135). With f = credited / total, clamped to [0.10, 1.00]:
/// 100 + 50 * (f - 0.10) / 0.90, rounded down. So 1.50% when the whole
/// invoice goes on credit, 1.22% for half, 1.00% for a tenth or less.
pub fn credit_fee_bps(credited: i128, total: i128) -> i128 {
    if total <= 0 || credited >= total {
        return CREDIT_FEE_BPS;
    }
    // (f - 0.10) / 0.90 = (10 * credited - total) / (9 * total)
    let tenfold = credited.saturating_mul(10).clamp(total, total.saturating_mul(10));
    let span = CREDIT_FEE_BPS - MIN_CREDIT_FEE_BPS;
    match ((tenfold - total).checked_mul(span), total.checked_mul(9)) {
        (Some(top), Some(bottom)) => MIN_CREDIT_FEE_BPS + top / bottom,
        _ => CREDIT_FEE_BPS, // too big to work out: charge the full rate
    }
}

/// (buffer bps, our bps) for a credit fee `rate`. Lenders always get
/// `LENDER_BPS`; the rest splits 3:1 buffer : us, the odd part to the buffer.
pub fn fee_split(rate: i128) -> (i128, i128) {
    let rest = rate - LENDER_BPS;
    let ours = rest / 4;
    (rest - ours, ours)
}

/// How many "days" past `due_at` it is now, rounded up; 0 if not past it.
/// A day is a seventh of the credit period (at least 1 second).
fn days_late(now: u64, due_at: u64, credit_period_secs: u64) -> u64 {
    if due_at == 0 || now <= due_at {
        return 0;
    }
    let day = (credit_period_secs / 7).max(1);
    (now - due_at).div_ceil(day)
}

fn days_u32(days: u64) -> u32 {
    u32::try_from(days).unwrap_or(u32::MAX)
}

fn bps(amount: i128, bps: i128) -> Result<i128, Error> {
    amount.checked_mul(bps).map(|x| x / 10_000).ok_or(Error::InvalidAmount)
}

fn is_approved(env: &Env, distributor: &Address) -> bool {
    env.storage().persistent().has(&DataKey::Distributor(distributor.clone()))
}

fn send(token: &token::Client, from: &Address, to: &Address, amount: i128) {
    if amount > 0 {
        token.transfer(from, to, &amount);
    }
}

/// Set the status and method after a payment, then save the invoice.
/// Saves the invoice after `amount` was paid by `method`, and adds it to the totals.
fn record_payment(env: &Env, invoice: &mut Invoice, method: PayMethod, amount: i128) {
    let mut totals = load_totals(env);
    match method {
        PayMethod::Digital => totals.digital = totals.digital.saturating_add(amount),
        PayMethod::Cash => totals.cash = totals.cash.saturating_add(amount),
        _ => totals.credit = totals.credit.saturating_add(amount),
    }
    save_totals(env, &totals);
    invoice.status = if invoice.paid == invoice.amount {
        InvoiceStatus::Paid
    } else {
        InvoiceStatus::PartPaid
    };
    invoice.method = match invoice.method {
        PayMethod::None => method,
        current if current == method => method,
        _ => PayMethod::Mixed,
    };
    put(env, &DataKey::Invoice(invoice.id), invoice);
}

/// Write a persistent entry and keep it (and the contract) alive ~30 days.
fn put<V: IntoVal<Env, Val>>(env: &Env, key: &DataKey, value: &V) {
    let storage = env.storage().persistent();
    storage.set(key, value);
    storage.extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND_TO);
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn add(env: &Env, key: DataKey, amount: i128) {
    let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
    put(env, &key, &(current + amount));
}

fn load_config(env: &Env) -> Config {
    env.storage().instance().get(&DataKey::Config).unwrap()
}

fn load_pool(env: &Env) -> Pool {
    env.storage().instance().get(&DataKey::Pool).unwrap()
}

fn save_pool(env: &Env, pool: &Pool) {
    env.storage().instance().set(&DataKey::Pool, pool);
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn load_totals(env: &Env) -> Totals {
    env.storage().instance().get(&DataKey::Totals).unwrap_or_default()
}

fn save_totals(env: &Env, totals: &Totals) {
    env.storage().instance().set(&DataKey::Totals, totals);
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

/// The invoice created `position`-th (0 = oldest), if it's still stored.
fn invoice_at(env: &Env, position: u32) -> Option<Invoice> {
    let chunk: Vec<u64> = env.storage().persistent().get(&DataKey::IdChunk(position / IDS_PER_CHUNK))?;
    let id = chunk.get(position % IDS_PER_CHUNK)?;
    env.storage().persistent().get(&DataKey::Invoice(id))
}

fn load_invoice(env: &Env, id: u64) -> Result<Invoice, Error> {
    env.storage().persistent().get(&DataKey::Invoice(id)).ok_or(Error::NotFound)
}

fn load_shop(env: &Env, shop: &Address) -> Option<Shop> {
    env.storage().persistent().get(&DataKey::Shop(shop.clone()))
}

fn save_shop(env: &Env, shop: &Address, terms: &Shop) {
    put(env, &DataKey::Shop(shop.clone()), terms);
}

#[cfg(test)]
mod test;
