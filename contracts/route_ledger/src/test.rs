#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    symbol_short,
    testutils::{Address as _, AuthorizedFunction, Ledger, MockAuth, MockAuthInvoke},
    xdr::ScErrorType,
    token::{StellarAssetClient, TokenClient},
    Address, Env, IntoVal, Symbol,
};

/// $1 in token units (7 decimals).
const USD: i128 = 10_000_000;
const WEEK: u64 = 7 * 24 * 60 * 60;
const DAY: u64 = WEEK / 7;
const START: u64 = 1_000_000;

struct Setup {
    env: Env,
    client: RouteLedgerClient<'static>,
    token: TokenClient<'static>,
    minter: StellarAssetClient<'static>,
    admin: Address,
    treasury: Address,
    distributor: Address,
    shop: Address,
    driver: Address,
    lender: Address,
}

/// The shop starts with $500 and the lender with $50,000. No deposit yet.
fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(START);

    let issuer = Address::generate(&env);
    let asset = env.register_stellar_asset_contract_v2(issuer);
    let token = TokenClient::new(&env, &asset.address());
    let minter = StellarAssetClient::new(&env, &asset.address());

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let contract_id = env.register(
        RouteLedger,
        (admin.clone(), asset.address(), treasury.clone(), WEEK),
    );
    let client = RouteLedgerClient::new(&env, &contract_id);
    let distributor = Address::generate(&env);
    client.approve_distributor(&distributor);

    let shop = Address::generate(&env);
    let lender = Address::generate(&env);
    minter.mint(&shop, &(500 * USD));
    minter.mint(&lender, &(50_000 * USD));

    Setup {
        client,
        token,
        minter,
        admin,
        treasury,
        distributor,
        shop,
        driver: Address::generate(&env),
        lender,
        env,
    }
}

impl Setup {
    fn invoice(&self, id: u64, amount: i128) {
        self.client.create_invoice(
            &self.distributor,
            &id,
            &self.shop,
            &self.driver,
            &amount,
            &(START + WEEK),
        );
    }

    fn balance(&self, who: &Address) -> i128 {
        self.token.balance(who)
    }

    fn contract_balance(&self) -> i128 {
        self.token.balance(&self.client.address)
    }

    /// Deposit $5,000 and give the shop the starting $200 limit.
    fn with_credit(&self) {
        self.client.deposit(&self.lender, &(5_000 * USD));
        self.client.set_terms(&self.shop, &(200 * USD));
    }

    /// The pool's books always match the contract's token balance.
    fn assert_pool_matches_balance(&self) {
        let pool = self.client.get_pool();
        assert_eq!(pool.available + pool.buffer, self.contract_balance());
    }
}

// ---------- v1: invoices and digital payments (#14) ----------

#[test]
fn create_and_pay_in_full() {
    let t = setup();
    t.invoice(1, 150 * USD);

    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.amount, 1_500_000_000);
    assert_eq!(invoice.paid, 0);
    assert_eq!(invoice.status, InvoiceStatus::Due);
    assert_eq!(invoice.method, PayMethod::None);

    t.client.pay(&t.shop, &1, &(150 * USD));

    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.paid, 1_500_000_000);
    assert_eq!(invoice.status, InvoiceStatus::Paid);
    assert_eq!(invoice.method, PayMethod::Digital);
    // 0.10% usage fee: $150 -> $149.85 to the distributor, $0.15 to us.
    assert_eq!(t.balance(&t.distributor), 1_498_500_000);
    assert_eq!(t.balance(&t.treasury), 1_500_000);
    assert_eq!(t.balance(&t.shop), 3_500_000_000);
}

#[test]
fn pay_in_parts() {
    let t = setup();
    t.invoice(1, 150 * USD);

    t.client.pay(&t.shop, &1, &(50 * USD));
    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.paid, 500_000_000);
    assert_eq!(invoice.status, InvoiceStatus::PartPaid);

    t.client.pay(&t.shop, &1, &(100 * USD));
    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.paid, 1_500_000_000);
    assert_eq!(invoice.status, InvoiceStatus::Paid);
    assert_eq!(invoice.method, PayMethod::Digital);
    assert_eq!(t.balance(&t.distributor), 1_498_500_000);
    assert_eq!(t.balance(&t.treasury), 1_500_000);
}

#[test]
fn pay_twice_is_already_paid() {
    let t = setup();
    t.invoice(1, 150 * USD);
    t.client.pay(&t.shop, &1, &(150 * USD));
    assert_eq!(t.client.try_pay(&t.shop, &1, &USD), Err(Ok(Error::AlreadyPaid)));
}

#[test]
fn overpay_is_rejected() {
    let t = setup();
    t.invoice(1, 150 * USD);
    assert_eq!(t.client.try_pay(&t.shop, &1, &(151 * USD)), Err(Ok(Error::Overpay)));

    t.client.pay(&t.shop, &1, &(100 * USD));
    assert_eq!(t.client.try_pay(&t.shop, &1, &(51 * USD)), Err(Ok(Error::Overpay)));
}

#[test]
fn zero_or_negative_amounts_are_invalid() {
    let t = setup();
    t.invoice(1, 150 * USD);
    assert_eq!(t.client.try_pay(&t.shop, &1, &0), Err(Ok(Error::InvalidAmount)));
    assert_eq!(t.client.try_pay(&t.shop, &1, &-USD), Err(Ok(Error::InvalidAmount)));

    let result = t.client.try_create_invoice(&t.distributor, &2, &t.shop, &t.driver, &0, &START);
    assert_eq!(result, Err(Ok(Error::InvalidAmount)));
}

#[test]
fn wrong_shop_cannot_pay() {
    let t = setup();
    t.invoice(1, 150 * USD);
    let other_shop = Address::generate(&t.env);
    t.minter.mint(&other_shop, &(500 * USD));
    assert_eq!(
        t.client.try_pay(&other_shop, &1, &(150 * USD)),
        Err(Ok(Error::NotYourInvoice))
    );
}

#[test]
fn duplicate_id_already_exists() {
    let t = setup();
    t.invoice(1, 150 * USD);
    let result =
        t.client.try_create_invoice(&t.distributor, &1, &t.shop, &t.driver, &USD, &START);
    assert_eq!(result, Err(Ok(Error::AlreadyExists)));
}

#[test]
fn unknown_invoice_is_not_found() {
    let t = setup();
    assert_eq!(t.client.try_get_invoice(&404), Err(Ok(Error::NotFound)));
    assert_eq!(t.client.try_pay(&t.shop, &404, &USD), Err(Ok(Error::NotFound)));
}

#[test]
fn usage_fee_rounds_down_into_the_treasury() {
    let t = setup();
    // $8.55 -> fee 85_500 units ($0.00855), rounded down.
    t.invoice(1, 85_500_000);
    t.client.pay(&t.shop, &1, &85_500_000);
    assert_eq!(t.balance(&t.treasury), 85_500);
    assert_eq!(t.balance(&t.distributor), 85_414_500);

    // 999 units -> fee 0.999 units, rounds down to 0: no transfer to us.
    t.invoice(2, 999);
    t.client.pay(&t.shop, &2, &999);
    assert_eq!(t.balance(&t.treasury), 85_500);
    assert_eq!(t.balance(&t.distributor), 85_414_500 + 999);
}

#[test]
fn only_the_shop_signs_a_payment() {
    let t = setup();
    t.invoice(1, 150 * USD);
    t.client.pay(&t.shop, &1, &(150 * USD));

    let auths = t.env.auths();
    assert_eq!(auths.len(), 1);
    let (signer, invocation) = &auths[0];
    assert_eq!(signer, &t.shop);
    assert_eq!(
        invocation.function,
        AuthorizedFunction::Contract((
            t.client.address.clone(),
            symbol_short!("pay"),
            (t.shop.clone(), 1u64, 150 * USD).into_val(&t.env),
        ))
    );
}

#[test]
fn list_invoices_returns_the_newest_60() {
    let t = setup();
    assert_eq!(t.client.list_invoices().len(), 0);

    for id in 1..=3 {
        t.invoice(id, USD);
    }
    let ids: std::vec::Vec<u64> = t.client.list_invoices().iter().map(|i| i.id).collect();
    assert_eq!(ids, [1, 2, 3]);

    for id in 4..=70 {
        t.invoice(id, USD);
    }
    let list = t.client.list_invoices();
    assert_eq!(list.len(), MAX_LIST);
    assert_eq!(list.first().unwrap().id, 11);
    assert_eq!(list.last().unwrap().id, 70);
}

#[test]
fn config_is_stored() {
    let t = setup();
    let config = t.client.get_config();
    assert_eq!(config.admin, t.admin);
    assert_eq!(config.treasury, t.treasury);
    assert_eq!(config.token, t.token.address);
    assert_eq!(config.credit_period_secs, WEEK);
}

// ---------- v2: cash (#19) ----------

#[test]
fn cash_payment_after_shop_confirms() {
    let t = setup();
    t.invoice(1, 150 * USD);

    t.client.cash_claim(&t.driver, &1, &(150 * USD));
    assert_eq!(t.client.get_cash_claim(&1), 1_500_000_000);
    // Nothing is paid until the shop confirms.
    assert_eq!(t.client.get_invoice(&1).status, InvoiceStatus::Due);

    t.client.cash_confirm(&t.shop, &1, &(150 * USD));
    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.status, InvoiceStatus::Paid);
    assert_eq!(invoice.method, PayMethod::Cash);
    assert_eq!(t.client.get_driver_cash(&t.driver), 1_500_000_000);
    assert_eq!(t.client.get_usage_owed(&t.distributor), 1_500_000);
    assert_eq!(t.client.get_cash_claim(&1), 0);
    // Cash moves no tokens.
    assert_eq!(t.balance(&t.shop), 500 * USD);
    assert_eq!(t.balance(&t.distributor), 0);
}

#[test]
fn confirm_without_a_claim_fails() {
    let t = setup();
    t.invoice(1, 150 * USD);
    assert_eq!(t.client.try_cash_confirm(&t.shop, &1, &(150 * USD)), Err(Ok(Error::NoCashClaim)));
}

#[test]
fn only_the_invoice_driver_can_claim() {
    let t = setup();
    t.invoice(1, 150 * USD);
    let other_driver = Address::generate(&t.env);
    assert_eq!(
        t.client.try_cash_claim(&other_driver, &1, &(150 * USD)),
        Err(Ok(Error::NotYourInvoice))
    );
}

#[test]
fn cash_claim_checks_amounts() {
    let t = setup();
    t.invoice(1, 150 * USD);
    assert_eq!(t.client.try_cash_claim(&t.driver, &1, &0), Err(Ok(Error::InvalidAmount)));
    assert_eq!(
        t.client.try_cash_claim(&t.driver, &1, &(151 * USD)),
        Err(Ok(Error::Overpay))
    );
}

#[test]
fn part_cash_then_digital_is_mixed() {
    let t = setup();
    t.invoice(1, 150 * USD);
    t.client.cash_claim(&t.driver, &1, &(50 * USD));
    t.client.cash_confirm(&t.shop, &1, &(50 * USD));
    assert_eq!(t.client.get_invoice(&1).status, InvoiceStatus::PartPaid);

    t.client.pay(&t.shop, &1, &(100 * USD));
    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.status, InvoiceStatus::Paid);
    assert_eq!(invoice.method, PayMethod::Mixed);
}

#[test]
fn stale_cash_claim_cannot_overpay() {
    let t = setup();
    t.invoice(1, 150 * USD);
    t.client.cash_claim(&t.driver, &1, &(100 * USD));
    // The shop pays $100 digitally before confirming the cash.
    t.client.pay(&t.shop, &1, &(100 * USD));
    assert_eq!(t.client.try_cash_confirm(&t.shop, &1, &(100 * USD)), Err(Ok(Error::Overpay)));

    // And once the invoice is fully paid, a leftover claim cannot be confirmed.
    t.client.pay(&t.shop, &1, &(50 * USD));
    assert_eq!(t.client.try_cash_confirm(&t.shop, &1, &(100 * USD)), Err(Ok(Error::AlreadyPaid)));
}

#[test]
fn cash_handed_in_reduces_what_the_driver_holds() {
    let t = setup();
    t.invoice(1, 150 * USD);
    t.client.cash_claim(&t.driver, &1, &(150 * USD));
    t.client.cash_confirm(&t.shop, &1, &(150 * USD));

    t.client.cash_handed_in(&t.distributor, &t.driver, &(100 * USD));
    assert_eq!(t.client.get_driver_cash(&t.driver), 500_000_000);

    assert_eq!(
        t.client.try_cash_handed_in(&t.distributor, &t.driver, &(51 * USD)),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        t.client.try_cash_handed_in(&t.distributor, &t.driver, &0),
        Err(Ok(Error::InvalidAmount))
    );
}

// ---------- v2: the lender pool and credit (#19) ----------

#[test]
fn deposit_moves_money_into_the_pool() {
    let t = setup();
    t.client.deposit(&t.lender, &(5_000 * USD));
    assert_eq!(t.client.get_pool(), Pool { available: 50_000_000_000, buffer: 0 });
    assert_eq!(t.contract_balance(), 50_000_000_000);
    assert_eq!(t.balance(&t.lender), 450_000_000_000);
    assert_eq!(t.client.try_deposit(&t.lender, &0), Err(Ok(Error::InvalidAmount)));
}

#[test]
fn credit_of_100() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    let pool_before = t.client.get_pool();
    let contract_before = t.contract_balance();

    t.client.pay_with_credit(&t.shop, &1);

    // $98.50 to the distributor, $0.25 to us, $0.75 to the buffer.
    assert_eq!(t.balance(&t.distributor), 985_000_000);
    assert_eq!(t.balance(&t.treasury), 2_500_000);
    let pool = t.client.get_pool();
    assert_eq!(pool.buffer, 7_500_000);
    assert_eq!(pool_before.available - pool.available, 995_000_000);
    assert_eq!(contract_before - t.contract_balance(), 987_500_000);
    t.assert_pool_matches_balance();

    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.status, InvoiceStatus::Paid);
    assert_eq!(invoice.method, PayMethod::Credit);
    let shop = t.client.get_shop(&t.shop);
    assert_eq!(shop.owed, 1_000_000_000);
    assert_eq!(shop.due_at, START + WEEK);
    assert!(!shop.overdue);
    // The shop's own money is untouched.
    assert_eq!(t.balance(&t.shop), 500 * USD);
}

#[test]
fn credit_of_150() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 150 * USD);
    let pool_before = t.client.get_pool();
    let contract_before = t.contract_balance();

    t.client.pay_with_credit(&t.shop, &1);

    assert_eq!(t.balance(&t.distributor), 1_477_500_000);
    assert_eq!(t.balance(&t.treasury), 3_750_000);
    let pool = t.client.get_pool();
    assert_eq!(pool.buffer, 11_250_000);
    assert_eq!(pool_before.available - pool.available, 1_492_500_000);
    assert_eq!(contract_before - t.contract_balance(), 1_481_250_000);
    t.assert_pool_matches_balance();
}

#[test]
fn credit_over_the_limit_fails() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 220 * USD);
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &1), Err(Ok(Error::OverLimit)));

    // Two invoices together cannot pass the limit either.
    t.invoice(2, 150 * USD);
    t.invoice(3, 60 * USD);
    t.client.pay_with_credit(&t.shop, &2);
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &3), Err(Ok(Error::OverLimit)));
}

#[test]
fn credit_needs_money_in_the_pool() {
    let t = setup();
    t.client.deposit(&t.lender, &(50 * USD));
    t.client.set_terms(&t.shop, &(200 * USD));
    t.invoice(1, 100 * USD);
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &1), Err(Ok(Error::PoolTooLow)));
}

#[test]
fn credit_needs_terms() {
    let t = setup();
    t.client.deposit(&t.lender, &(5_000 * USD));
    t.invoice(1, 100 * USD);
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &1), Err(Ok(Error::NoCreditTerms)));
}

#[test]
fn no_new_credit_while_overdue() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.invoice(2, 50 * USD);
    t.client.pay_with_credit(&t.shop, &1);

    t.env.ledger().set_timestamp(START + WEEK + 1);
    assert!(t.client.get_shop(&t.shop).overdue);
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &2), Err(Ok(Error::Overdue)));
}

#[test]
fn part_digital_then_credit_is_mixed() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 150 * USD);
    t.client.pay(&t.shop, &1, &(50 * USD));
    let distributor_before = t.balance(&t.distributor);

    t.client.pay_with_credit(&t.shop, &1);

    // Credit covers the remaining $100 only.
    assert_eq!(t.client.get_shop(&t.shop).owed, 1_000_000_000);
    // Two thirds on credit: 1.31% (#135), so $98.69 instead of $98.50.
    assert_eq!(t.balance(&t.distributor) - distributor_before, 986_900_000);
    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.status, InvoiceStatus::Paid);
    assert_eq!(invoice.method, PayMethod::Mixed);
}

#[test]
fn credit_on_a_paid_invoice_fails() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &1), Err(Ok(Error::AlreadyPaid)));
}

#[test]
fn set_terms_rejects_a_negative_limit() {
    let t = setup();
    assert_eq!(t.client.try_set_terms(&t.shop, &-1), Err(Ok(Error::InvalidAmount)));
}

// ---------- v3: repayment and the credit record (#24) ----------

#[test]
fn full_cycle_on_time() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);

    t.client.pay_with_credit(&t.shop, &1);
    assert_eq!(t.contract_balance(), 49_012_500_000);

    t.env.ledger().set_timestamp(START + WEEK); // the last second still counts
    t.client.repay(&t.shop, &(100 * USD));

    assert_eq!(t.contract_balance(), 50_012_500_000);
    assert_eq!(t.client.get_pool(), Pool { available: 50_005_000_000, buffer: 7_500_000 });
    t.assert_pool_matches_balance();
    assert_eq!(t.balance(&t.shop), 4_000_000_000);

    let shop = t.client.get_shop(&t.shop);
    assert_eq!(shop.owed, 0);
    assert_eq!(shop.due_at, 0);
    assert_eq!(shop.on_time, 1);
    assert_eq!(shop.late, 0);
    assert_eq!(shop.total_repaid, 1_000_000_000);
    assert_eq!(shop.limit, 2_250_000_000);
    assert!(!shop.overdue);
}

#[test]
fn repaying_within_the_grace_day_counts_as_on_time() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);

    t.env.ledger().set_timestamp(START + WEEK + DAY); // one full day late
    t.client.repay(&t.shop, &(100 * USD));

    let shop = t.client.get_shop(&t.shop);
    assert_eq!((shop.on_time, shop.late), (1, 0));
    assert_eq!(shop.limit, 2_250_000_000);
    assert_eq!(shop.max_days_late, 1);
}

#[test]
fn two_to_seven_days_late_is_minor_and_drops_25() {
    for late_by in [DAY + 1, 2 * DAY, 7 * DAY] {
        let t = setup();
        t.with_credit();
        t.invoice(1, 100 * USD);
        t.client.pay_with_credit(&t.shop, &1);

        t.env.ledger().set_timestamp(START + WEEK + late_by);
        t.client.repay(&t.shop, &(100 * USD));

        let shop = t.client.get_shop(&t.shop);
        assert_eq!((shop.late, shop.late_minor, shop.late_major), (1, 1, 0), "{late_by}");
        assert_eq!(shop.on_time, 0);
        assert_eq!(shop.limit, 1_750_000_000);
        assert_eq!((shop.owed, shop.due_at), (0, 0));
        assert_eq!(shop.max_days_late as u64, late_by.div_ceil(DAY));
    }
}

#[test]
fn eight_or_more_days_late_is_major_drops_50_and_stops_raises_for_4_periods() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);

    let repaid_at = START + WEEK + 7 * DAY + 1; // 8 days late
    t.env.ledger().set_timestamp(repaid_at);
    t.client.repay(&t.shop, &(100 * USD));

    let shop = t.client.get_shop(&t.shop);
    assert_eq!((shop.late, shop.late_minor, shop.late_major), (1, 0, 1));
    assert_eq!(shop.limit, 1_500_000_000);
    assert_eq!(shop.max_days_late, 8);

    // On time, but inside the 4 periods: no raise.
    t.invoice(2, 100 * USD);
    t.client.pay_with_credit(&t.shop, &2);
    t.client.repay(&t.shop, &(100 * USD));
    let shop = t.client.get_shop(&t.shop);
    assert_eq!((shop.on_time, shop.limit), (1, 1_500_000_000));

    // After the 4 periods, on time raises the limit again.
    t.env.ledger().set_timestamp(repaid_at + 4 * WEEK);
    t.invoice(3, 100 * USD);
    t.client.pay_with_credit(&t.shop, &3);
    t.client.repay(&t.shop, &(100 * USD));
    let shop = t.client.get_shop(&t.shop);
    assert_eq!((shop.on_time, shop.limit), (2, 1_750_000_000));
}

#[test]
fn first_credit_date_is_kept() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 50 * USD);
    t.invoice(2, 50 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    t.env.ledger().set_timestamp(START + DAY);
    t.client.pay_with_credit(&t.shop, &2);
    assert_eq!(t.client.get_shop(&t.shop).first_credit_at, START);
}

#[test]
fn partial_repayment_keeps_the_due_date() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);

    t.client.repay(&t.shop, &(40 * USD));
    let shop = t.client.get_shop(&t.shop);
    assert_eq!(shop.owed, 600_000_000);
    assert_eq!(shop.due_at, START + WEEK);
    assert_eq!(shop.total_repaid, 400_000_000);
    assert_eq!((shop.on_time, shop.late), (0, 0));

    t.client.repay(&t.shop, &(60 * USD));
    let shop = t.client.get_shop(&t.shop);
    assert_eq!(shop.owed, 0);
    assert_eq!(shop.on_time, 1);
    t.assert_pool_matches_balance();
}

#[test]
fn limit_stops_at_500() {
    let t = setup();
    t.client.deposit(&t.lender, &(5_000 * USD));
    t.client.set_terms(&t.shop, &(490 * USD));
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    t.client.repay(&t.shop, &(100 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 5_000_000_000);

    // At the cap, another on-time repayment changes nothing.
    t.invoice(2, 100 * USD);
    t.client.pay_with_credit(&t.shop, &2);
    t.client.repay(&t.shop, &(100 * USD));
    let shop = t.client.get_shop(&t.shop);
    assert_eq!(shop.limit, 5_000_000_000);
    assert_eq!(shop.on_time, 2);
}

#[test]
fn a_limit_above_the_cap_is_left_alone() {
    let t = setup();
    t.client.deposit(&t.lender, &(5_000 * USD));
    t.client.set_terms(&t.shop, &(800 * USD));
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    t.client.repay(&t.shop, &(100 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 8_000_000_000);
}

#[test]
fn repay_checks() {
    let t = setup();
    t.with_credit();
    assert_eq!(t.client.try_repay(&t.shop, &USD), Err(Ok(Error::NothingOwed)));
    let stranger = Address::generate(&t.env);
    assert_eq!(t.client.try_repay(&stranger, &USD), Err(Ok(Error::NothingOwed)));

    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    assert_eq!(t.client.try_repay(&t.shop, &(101 * USD)), Err(Ok(Error::InvalidAmount)));
    assert_eq!(t.client.try_repay(&t.shop, &0), Err(Ok(Error::InvalidAmount)));
}

#[test]
fn shop_without_terms_shows_zeros() {
    let t = setup();
    let shop = t.client.get_shop(&t.shop);
    assert_eq!(
        shop,
        ShopView {
            limit: 0,
            owed: 0,
            due_at: 0,
            overdue: false,
            on_time: 0,
            late: 0,
            total_repaid: 0,
            written_off: 0,
            late_minor: 0,
            late_major: 0,
            max_days_late: 0,
            first_credit_at: 0,
        }
    );
}

#[test]
fn set_terms_keeps_the_record() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    t.client.repay(&t.shop, &(100 * USD));

    t.client.set_terms(&t.shop, &(300 * USD));
    let shop = t.client.get_shop(&t.shop);
    assert_eq!(shop.limit, 3_000_000_000);
    assert_eq!(shop.on_time, 1);
    assert_eq!(shop.total_repaid, 1_000_000_000);
}

// ---------- review fixes (Nov 10) ----------

#[test]
fn only_approved_distributors_create_invoices() {
    let t = setup();
    let stranger = Address::generate(&t.env);
    assert!(t.client.is_distributor(&t.distributor));
    assert!(!t.client.is_distributor(&stranger));
    assert_eq!(
        t.client.try_create_invoice(&stranger, &1, &t.shop, &t.driver, &(100 * USD), &START),
        Err(Ok(Error::NotApproved))
    );
}

#[test]
fn tiny_loans_do_not_grow_the_limit() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 39 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    t.client.repay(&t.shop, &(39 * USD));
    let shop = t.client.get_shop(&t.shop);
    assert_eq!(shop.on_time, 1);
    assert_eq!(shop.limit, 200 * USD);
}

#[test]
fn small_loans_in_one_cycle_add_up() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 20 * USD);
    t.invoice(2, 20 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    t.client.pay_with_credit(&t.shop, &2);
    t.client.repay(&t.shop, &(40 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 225 * USD);
}

#[test]
fn one_raise_per_credit_period() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    t.client.repay(&t.shop, &(100 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 225 * USD);

    // Same week: borrowing and repaying again doesn't raise it.
    t.invoice(2, 100 * USD);
    t.client.pay_with_credit(&t.shop, &2);
    t.client.repay(&t.shop, &(100 * USD));
    let shop = t.client.get_shop(&t.shop);
    assert_eq!(shop.limit, 225 * USD);
    assert_eq!(shop.on_time, 2);

    // A week later it does.
    t.env.ledger().set_timestamp(START + WEEK);
    t.invoice(3, 100 * USD);
    t.client.pay_with_credit(&t.shop, &3);
    t.client.repay(&t.shop, &(100 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 250 * USD);
}

#[test]
fn default_is_covered_by_the_buffer() {
    let t = setup();
    t.with_credit();
    t.client.fund_buffer(&t.lender, &(50 * USD));
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    let available_before = t.client.get_pool().available;

    // Not yet: 4 weeks late is the line.
    t.env.ledger().set_timestamp(START + WEEK + 4 * WEEK);
    assert_eq!(t.client.try_cover_default(&t.shop), Err(Ok(Error::NotInDefault)));

    t.env.ledger().set_timestamp(START + WEEK + 4 * WEEK + 1);
    t.client.cover_default(&t.shop);
    let pool = t.client.get_pool();
    // Buffer had $50 + $0.75: it gives all of it back to the lenders.
    assert_eq!(pool.buffer, 0);
    assert_eq!(pool.available - available_before, 507_500_000);
    t.assert_pool_matches_balance();

    let shop = t.client.get_shop(&t.shop);
    assert_eq!((shop.owed, shop.limit, shop.late), (0, 0, 1));
    assert_eq!(shop.written_off, 100 * USD);
    assert!(!shop.overdue);
    assert_eq!(t.client.try_cover_default(&t.shop), Err(Ok(Error::NothingOwed)));

    // Credit is off.
    t.invoice(2, 10 * USD);
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &2), Err(Ok(Error::OverLimit)));

    // Paying it back later refills the buffer.
    t.client.repay(&t.shop, &(30 * USD));
    assert_eq!(t.client.get_pool().buffer, 30 * USD);
    assert_eq!(t.client.get_shop(&t.shop).written_off, 70 * USD);
    assert_eq!(t.client.try_repay(&t.shop, &(71 * USD)), Err(Ok(Error::InvalidAmount)));
    t.assert_pool_matches_balance();
}

#[test]
fn small_buffer_covers_what_it_can() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    let available_before = t.client.get_pool().available;
    t.env.ledger().set_timestamp(START + 6 * WEEK);
    t.client.cover_default(&t.shop);
    // Only the $0.75 buffer was there; the lenders carry the other $99.25.
    assert_eq!(t.client.get_pool().available - available_before, 7_500_000);
    assert_eq!(t.client.get_pool().buffer, 0);
}

#[test]
fn fund_buffer_checks_the_amount() {
    let t = setup();
    assert_eq!(t.client.try_fund_buffer(&t.lender, &0), Err(Ok(Error::InvalidAmount)));
    t.client.fund_buffer(&t.lender, &(10 * USD));
    assert_eq!(t.client.get_pool(), Pool { available: 0, buffer: 10 * USD });
    t.assert_pool_matches_balance();
}

// ---------- security review (#29) ----------
// Most tests above run under `mock_all_auths`, where any signer passes. The tests
// below use `mock_auths` for ONE address and one exact call, so a wrong signer
// really is wrong. Auth failures are host errors, not our `Error`s: they come
// back as `Err(Err(_))`.

/// The call failed, and not with one of our own contract errors. Functions that
/// return `()` report an auth failure as `Err(Ok(sdk Error))`, the others as
/// `Err(Err(_))`, so both shapes pass; success or a contract error does not.
macro_rules! assert_not_signed {
    ($call:expr) => {{
        let result = $call;
        match &result {
            Err(Err(_)) => {}
            Err(Ok(e)) => {
                let e: soroban_sdk::Error = e.clone().into();
                assert!(!e.is_type(ScErrorType::Contract), "a contract error, not auth: {result:?}");
            }
            _ => panic!("went through without the right signature: {result:?}"),
        }
    }};
}

/// Everything a failed call must leave exactly as it was.
#[derive(Debug, PartialEq)]
struct Snapshot {
    pool: Pool,
    contract: i128,
    shop: i128,
    distributor: i128,
    treasury: i128,
    lender: i128,
    shop_record: ShopView,
}

impl Setup {
    fn stranger(&self) -> Address {
        Address::generate(&self.env)
    }

    /// A second shop with $500 in its wallet.
    fn other_shop(&self) -> Address {
        let shop = Address::generate(&self.env);
        self.minter.mint(&shop, &(500 * USD));
        shop
    }

    /// From now on only `signer` has signed, and only for this exact call.
    fn only(&self, signer: &Address, fn_name: &'static str, args: Vec<Val>) {
        self.env.mock_auths(&[MockAuth {
            address: signer,
            invoke: &MockAuthInvoke {
                contract: &self.client.address,
                fn_name,
                args,
                sub_invokes: &[],
            },
        }]);
    }

    /// Back to "everyone signs" for the next normal call.
    fn everyone(&self) {
        self.env.mock_all_auths();
    }

    fn snapshot(&self) -> Snapshot {
        Snapshot {
            pool: self.client.get_pool(),
            contract: self.contract_balance(),
            shop: self.balance(&self.shop),
            distributor: self.balance(&self.distributor),
            treasury: self.balance(&self.treasury),
            lender: self.balance(&self.lender),
            shop_record: self.client.get_shop(&self.shop),
        }
    }

    /// The last call asked for exactly one signature: `who`, on `fn_name`.
    fn assert_signed_by(&self, who: &Address, fn_name: &str) {
        let auths = self.env.auths();
        assert_eq!(auths.len(), 1, "{fn_name} asked for {} signers", auths.len());
        let (signer, invocation) = &auths[0];
        assert_eq!(signer, who, "{fn_name} was signed by the wrong address");
        match &invocation.function {
            AuthorizedFunction::Contract((contract, name, _)) => {
                assert_eq!(contract, &self.client.address, "{fn_name}");
                assert_eq!(name, &Symbol::new(&self.env, fn_name));
            }
            _ => panic!("{fn_name}: unexpected auth function"),
        }
    }

    /// No invoice is ever paid for more than it is worth.
    fn assert_nothing_overpaid(&self) {
        for invoice in self.client.list_invoices().iter() {
            assert!(invoice.paid >= 0 && invoice.paid <= invoice.amount, "{invoice:?}");
        }
    }
}

#[test]
fn constructor_cannot_be_run_again() {
    let t = setup();
    let attacker = Address::generate(&t.env);
    let args: Vec<Val> =
        (attacker.clone(), t.token.address.clone(), attacker.clone(), 1u64).into_val(&t.env);
    let result = t.env.try_invoke_contract::<(), Error>(
        &t.client.address,
        &Symbol::new(&t.env, "__constructor"),
        args,
    );
    assert!(result.is_err());
    let config = t.client.get_config();
    assert_eq!(config.admin, t.admin);
    assert_eq!(config.treasury, t.treasury);
    assert_eq!(config.credit_period_secs, WEEK);
}

#[test]
fn each_function_asks_for_exactly_its_documented_signer() {
    let t = setup();

    t.client.approve_distributor(&t.stranger());
    t.assert_signed_by(&t.admin, "approve_distributor");

    t.invoice(1, 100 * USD);
    t.assert_signed_by(&t.distributor, "create_invoice");

    t.client.pay(&t.shop, &1, &(40 * USD));
    t.assert_signed_by(&t.shop, "pay");

    t.client.cash_claim(&t.driver, &1, &(20 * USD));
    t.assert_signed_by(&t.driver, "cash_claim");

    t.client.cash_confirm(&t.shop, &1, &(20 * USD));
    t.assert_signed_by(&t.shop, "cash_confirm");

    t.client.cash_handed_in(&t.distributor, &t.driver, &(10 * USD));
    t.assert_signed_by(&t.distributor, "cash_handed_in");

    t.client.deposit(&t.lender, &(5_000 * USD));
    t.assert_signed_by(&t.lender, "deposit");

    t.client.set_terms(&t.shop, &(200 * USD));
    t.assert_signed_by(&t.admin, "set_terms");

    t.client.pay_with_credit(&t.shop, &1);
    t.assert_signed_by(&t.shop, "pay_with_credit");

    t.client.repay(&t.shop, &(10 * USD));
    t.assert_signed_by(&t.shop, "repay");

    t.client.fund_buffer(&t.lender, &(10 * USD));
    t.assert_signed_by(&t.lender, "fund_buffer");

    t.env.ledger().set_timestamp(START + 6 * WEEK);
    t.client.cover_default(&t.shop);
    t.assert_signed_by(&t.admin, "cover_default");
}

#[test]
fn wrong_signer_cannot_create_invoices_or_approve_distributors() {
    let t = setup();
    let stranger = t.stranger();

    t.only(&stranger, "approve_distributor", (stranger.clone(),).into_val(&t.env));
    assert_not_signed!(t.client.try_approve_distributor(&stranger));
    assert!(!t.client.is_distributor(&stranger));

    // A distributor can't approve another one, and can't sign as the admin.
    t.only(&t.distributor, "approve_distributor", (stranger.clone(),).into_val(&t.env));
    assert_not_signed!(t.client.try_approve_distributor(&stranger));
    assert!(!t.client.is_distributor(&stranger));

    // Signing as someone else's distributor address doesn't work either.
    let args: Vec<Val> =
        (t.distributor.clone(), 1u64, t.shop.clone(), t.driver.clone(), 100 * USD, START)
            .into_val(&t.env);
    t.only(&stranger, "create_invoice", args);
    let result = t.client.try_create_invoice(
        &t.distributor,
        &1,
        &t.shop,
        &t.driver,
        &(100 * USD),
        &START,
    );
    assert_not_signed!(result);
    assert_eq!(t.client.try_get_invoice(&1), Err(Ok(Error::NotFound)));

    // Control: the right signer, alone, is enough.
    t.only(&t.admin, "approve_distributor", (stranger.clone(),).into_val(&t.env));
    t.client.approve_distributor(&stranger);
    assert!(t.client.is_distributor(&stranger));
}

#[test]
fn wrong_signer_cannot_move_a_shops_money() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.invoice(2, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1); // the shop now owes $100
    let before = t.snapshot();
    let invoice_before = t.client.get_invoice(&2);

    // Anyone but the shop: a stranger, the distributor, the driver.
    for signer in [t.stranger(), t.distributor.clone(), t.driver.clone()] {
        t.only(&signer, "pay", (t.shop.clone(), 2u64, 10 * USD).into_val(&t.env));
        assert_not_signed!(t.client.try_pay(&t.shop, &2, &(10 * USD)));

        t.only(&signer, "pay_with_credit", (t.shop.clone(), 2u64).into_val(&t.env));
        assert_not_signed!(t.client.try_pay_with_credit(&t.shop, &2));

        t.only(&signer, "repay", (t.shop.clone(), 50 * USD).into_val(&t.env));
        assert_not_signed!(t.client.try_repay(&t.shop, &(50 * USD)));
    }

    assert_eq!(t.snapshot(), before);
    assert_eq!(t.client.get_invoice(&2), invoice_before);
    assert_eq!(t.client.get_shop(&t.shop).owed, 100 * USD);

    // Control: the shop's own signature is what lets the same call through.
    t.everyone();
    t.client.repay(&t.shop, &(50 * USD));
    assert_eq!(t.client.get_shop(&t.shop).owed, 50 * USD);
}

#[test]
fn wrong_signer_cannot_record_cash() {
    let t = setup();
    t.invoice(1, 150 * USD);

    // Not the driver: a stranger, or the shop itself.
    for signer in [t.stranger(), t.shop.clone()] {
        t.only(&signer, "cash_claim", (t.driver.clone(), 1u64, 100 * USD).into_val(&t.env));
        assert_not_signed!(t.client.try_cash_claim(&t.driver, &1, &(100 * USD)));
    }
    assert_eq!(t.client.get_cash_claim(&1), 0);

    t.everyone();
    t.client.cash_claim(&t.driver, &1, &(100 * USD));

    // Not the shop: a stranger, or the driver confirming their own claim.
    for signer in [t.stranger(), t.driver.clone()] {
        t.only(&signer, "cash_confirm", (t.shop.clone(), 1u64, 100 * USD).into_val(&t.env));
        assert_not_signed!(t.client.try_cash_confirm(&t.shop, &1, &(100 * USD)));
    }
    let invoice = t.client.get_invoice(&1);
    assert_eq!((invoice.paid, invoice.status), (0, InvoiceStatus::Due));
    assert_eq!(t.client.get_cash_claim(&1), 100 * USD);
    assert_eq!(t.client.get_driver_cash(&t.driver), 0);

    t.everyone();
    t.client.cash_confirm(&t.shop, &1, &(100 * USD));
    assert_eq!(t.client.get_driver_cash(&t.driver), 100 * USD);

    // Not the distributor: a stranger, or the driver clearing their own cash.
    for signer in [t.stranger(), t.driver.clone()] {
        let args: Vec<Val> = (t.distributor.clone(), t.driver.clone(), 50 * USD).into_val(&t.env);
        t.only(&signer, "cash_handed_in", args);
        assert_not_signed!(t.client.try_cash_handed_in(&t.distributor, &t.driver, &(50 * USD)));
    }
    assert_eq!(t.client.get_driver_cash(&t.driver), 100 * USD);

    // Control: the distributor's own signature works.
    let args: Vec<Val> = (t.distributor.clone(), t.driver.clone(), 50 * USD).into_val(&t.env);
    t.only(&t.distributor, "cash_handed_in", args);
    t.client.cash_handed_in(&t.distributor, &t.driver, &(50 * USD));
    assert_eq!(t.client.get_driver_cash(&t.driver), 50 * USD);
}

#[test]
fn wrong_signer_cannot_touch_the_pool() {
    let t = setup();
    t.client.deposit(&t.lender, &(1_000 * USD));
    let before = t.snapshot();

    // Someone else can't spend the lender's dollars on the lender's behalf.
    for signer in [t.stranger(), t.shop.clone(), t.distributor.clone()] {
        t.only(&signer, "deposit", (t.lender.clone(), 100 * USD).into_val(&t.env));
        assert_not_signed!(t.client.try_deposit(&t.lender, &(100 * USD)));

        t.only(&signer, "fund_buffer", (t.lender.clone(), 100 * USD).into_val(&t.env));
        assert_not_signed!(t.client.try_fund_buffer(&t.lender, &(100 * USD)));
    }
    assert_eq!(t.snapshot(), before);
    t.assert_pool_matches_balance();
}

#[test]
fn set_terms_and_cover_default_need_the_admin() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1);
    t.env.ledger().set_timestamp(START + 6 * WEEK); // 4+ periods late
    let before = t.snapshot();

    // The shop can't raise its own limit, and nobody else can either.
    for signer in [t.stranger(), t.shop.clone(), t.distributor.clone(), t.lender.clone()] {
        t.only(&signer, "set_terms", (t.shop.clone(), 500 * USD).into_val(&t.env));
        assert_not_signed!(t.client.try_set_terms(&t.shop, &(500 * USD)));

        t.only(&signer, "cover_default", (t.shop.clone(),).into_val(&t.env));
        assert_not_signed!(t.client.try_cover_default(&t.shop));
    }
    assert_eq!(t.snapshot(), before);
    assert_eq!(t.client.get_shop(&t.shop).limit, 200 * USD);
    assert_eq!(t.client.get_shop(&t.shop).owed, 100 * USD);

    // Control: with only the admin's signature both calls go through.
    t.only(&t.admin, "set_terms", (t.shop.clone(), 500 * USD).into_val(&t.env));
    t.client.set_terms(&t.shop, &(500 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 500 * USD);

    t.only(&t.admin, "cover_default", (t.shop.clone(),).into_val(&t.env));
    t.client.cover_default(&t.shop);
    assert_eq!(t.client.get_shop(&t.shop).written_off, 100 * USD);
}

#[test]
fn double_cash_confirm_is_no_cash_claim() {
    let t = setup();
    t.invoice(1, 150 * USD);
    t.client.cash_claim(&t.driver, &1, &(50 * USD));
    t.client.cash_confirm(&t.shop, &1, &(50 * USD));
    let invoice = t.client.get_invoice(&1);
    assert_eq!(invoice.paid, 50 * USD);

    // The claim is used up: the second confirm finds nothing and adds nothing.
    assert_eq!(t.client.try_cash_confirm(&t.shop, &1, &(50 * USD)), Err(Ok(Error::NoCashClaim)));
    assert_eq!(t.client.get_invoice(&1), invoice);
    assert_eq!(t.client.get_driver_cash(&t.driver), 50 * USD);
    assert_eq!(t.client.get_usage_owed(&t.distributor), 500_000);

    // Same when the first confirm paid the invoice off: NoCashClaim, not AlreadyPaid.
    t.client.cash_claim(&t.driver, &1, &(100 * USD));
    t.client.cash_confirm(&t.shop, &1, &(100 * USD));
    assert_eq!(t.client.get_invoice(&1).status, InvoiceStatus::Paid);
    assert_eq!(t.client.try_cash_confirm(&t.shop, &1, &(100 * USD)), Err(Ok(Error::NoCashClaim)));
    assert_eq!(t.client.get_invoice(&1).paid, 150 * USD);
    assert_eq!(t.client.get_driver_cash(&t.driver), 150 * USD);
    t.assert_nothing_overpaid();
}

#[test]
fn confirming_another_shops_claim_is_not_your_invoice() {
    let t = setup();
    let other = t.other_shop();
    t.invoice(1, 150 * USD);
    t.client.cash_claim(&t.driver, &1, &(100 * USD));

    assert_eq!(t.client.try_cash_confirm(&other, &1, &(100 * USD)), Err(Ok(Error::NotYourInvoice)));
    // The claim is untouched and nothing was recorded.
    assert_eq!(t.client.get_cash_claim(&1), 100 * USD);
    assert_eq!(t.client.get_invoice(&1).paid, 0);
    assert_eq!(t.client.get_driver_cash(&t.driver), 0);
    assert_eq!(t.client.get_usage_owed(&t.distributor), 0);

    // The real shop can still confirm it.
    t.client.cash_confirm(&t.shop, &1, &(100 * USD));
    assert_eq!(t.client.get_invoice(&1).paid, 100 * USD);
}

#[test]
fn a_stale_claim_never_pushes_paid_above_amount() {
    let t = setup();

    // The shop pays most of it digitally after a bigger cash claim: rejected.
    t.invoice(1, 100 * USD);
    t.client.cash_claim(&t.driver, &1, &(60 * USD));
    t.client.pay(&t.shop, &1, &(50 * USD));
    assert_eq!(t.client.try_cash_confirm(&t.shop, &1, &(60 * USD)), Err(Ok(Error::Overpay)));
    let invoice = t.client.get_invoice(&1);
    assert_eq!((invoice.paid, invoice.status), (50 * USD, InvoiceStatus::PartPaid));
    assert_eq!(t.client.get_driver_cash(&t.driver), 0);
    assert_eq!(t.client.get_usage_owed(&t.distributor), 0);

    // Paying the rest closes it, and the old claim is still rejected.
    t.client.pay(&t.shop, &1, &(50 * USD));
    assert_eq!(t.client.try_cash_confirm(&t.shop, &1, &(60 * USD)), Err(Ok(Error::AlreadyPaid)));
    assert_eq!(t.client.get_invoice(&1).paid, 100 * USD);

    // The shop pays all of it digitally after a full cash claim: rejected.
    t.invoice(2, 100 * USD);
    t.client.cash_claim(&t.driver, &2, &(100 * USD));
    t.client.pay(&t.shop, &2, &(100 * USD));
    assert_eq!(t.client.try_cash_confirm(&t.shop, &2, &(100 * USD)), Err(Ok(Error::AlreadyPaid)));
    assert_eq!(t.client.try_cash_claim(&t.driver, &2, &USD), Err(Ok(Error::AlreadyPaid)));
    assert_eq!(t.client.get_invoice(&2).paid, 100 * USD);

    // A claim that fits what is left is fine and lands exactly on the amount.
    t.invoice(3, 100 * USD);
    t.client.cash_claim(&t.driver, &3, &(40 * USD));
    t.client.pay(&t.shop, &3, &(60 * USD));
    t.client.cash_confirm(&t.shop, &3, &(40 * USD));
    let invoice = t.client.get_invoice(&3);
    assert_eq!((invoice.paid, invoice.status), (100 * USD, InvoiceStatus::Paid));

    // Only the confirmed $40 was ever cash.
    assert_eq!(t.client.get_driver_cash(&t.driver), 40 * USD);
    t.assert_nothing_overpaid();
}

#[test]
fn repay_by_a_different_shop_leaves_the_first_debt_alone() {
    let t = setup();
    t.with_credit();
    let other = t.other_shop();
    t.client.set_terms(&other, &(200 * USD));

    t.invoice(1, 100 * USD);
    t.client.create_invoice(&t.distributor, &2, &other, &t.driver, &(30 * USD), &(START + WEEK));
    t.client.pay_with_credit(&t.shop, &1);
    t.client.pay_with_credit(&other, &2);
    let first_shop = t.client.get_shop(&t.shop);
    assert_eq!(first_shop.owed, 100 * USD);

    // The other shop can't repay more than its own $30, even though $100 is owed overall.
    assert_eq!(t.client.try_repay(&other, &(31 * USD)), Err(Ok(Error::InvalidAmount)));
    assert_eq!(t.client.get_shop(&t.shop), first_shop);

    // Its own repayment only touches its own record.
    t.client.repay(&other, &(30 * USD));
    assert_eq!(t.client.get_shop(&other).owed, 0);
    assert_eq!(t.client.get_shop(&t.shop), first_shop);

    // With nothing owed, it can't pay anything down: the first shop's debt stays.
    assert_eq!(t.client.try_repay(&other, &(10 * USD)), Err(Ok(Error::NothingOwed)));
    assert_eq!(t.client.try_repay(&t.stranger(), &(10 * USD)), Err(Ok(Error::NothingOwed)));
    assert_eq!(t.client.get_shop(&t.shop), first_shop);
    t.assert_pool_matches_balance();
}

#[test]
fn credit_on_another_shops_invoice_is_not_your_invoice() {
    let t = setup();
    t.with_credit();
    let other = t.other_shop();
    t.client.set_terms(&other, &(500 * USD));
    t.invoice(1, 100 * USD); // t.shop's invoice
    let before = t.snapshot();
    let other_before = t.client.get_shop(&other);

    assert_eq!(t.client.try_pay_with_credit(&other, &1), Err(Ok(Error::NotYourInvoice)));

    // No pool money moved, and nobody took on a debt.
    assert_eq!(t.snapshot(), before);
    assert_eq!(t.client.get_shop(&other), other_before);
    assert_eq!(t.client.get_invoice(&1).status, InvoiceStatus::Due);
    assert_eq!(t.balance(&t.distributor), 0);
}

#[test]
fn zero_and_negative_amounts_are_invalid_everywhere() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    t.client.pay_with_credit(&t.shop, &1); // the shop owes, so repay gets as far as the amount
    t.invoice(2, 100 * USD);
    let before = t.snapshot();

    for bad in [0, -1, -USD, i128::MIN] {
        assert_eq!(t.client.try_deposit(&t.lender, &bad), Err(Ok(Error::InvalidAmount)));
        assert_eq!(t.client.try_fund_buffer(&t.lender, &bad), Err(Ok(Error::InvalidAmount)));
        assert_eq!(t.client.try_pay(&t.shop, &2, &bad), Err(Ok(Error::InvalidAmount)));
        assert_eq!(t.client.try_repay(&t.shop, &bad), Err(Ok(Error::InvalidAmount)));
        assert_eq!(t.client.try_cash_claim(&t.driver, &2, &bad), Err(Ok(Error::InvalidAmount)));
        assert_eq!(
            t.client.try_cash_handed_in(&t.distributor, &t.driver, &bad),
            Err(Ok(Error::InvalidAmount))
        );
        let result =
            t.client.try_create_invoice(&t.distributor, &3, &t.shop, &t.driver, &bad, &START);
        assert_eq!(result, Err(Ok(Error::InvalidAmount)));
    }
    assert_eq!(t.client.try_set_terms(&t.shop, &i128::MIN), Err(Ok(Error::InvalidAmount)));

    assert_eq!(t.snapshot(), before);
    assert_eq!(t.client.try_get_invoice(&3), Err(Ok(Error::NotFound)));
    assert_eq!(t.client.get_cash_claim(&2), 0);
}

#[test]
fn huge_amounts_overflow_nothing_and_move_nothing() {
    let t = setup();
    t.client.deposit(&t.lender, &(5_000 * USD));
    t.client.set_terms(&t.shop, &i128::MAX);
    t.invoice(1, 100 * USD); // a small debt first, so `owed` is not 0
    t.client.pay_with_credit(&t.shop, &1);
    // An approved distributor can write an invoice for i128::MAX; the math must cope.
    t.invoice(2, i128::MAX);
    let before = t.snapshot();

    // Digital: the 0.10% fee would overflow, so it is refused before any transfer.
    assert_eq!(t.client.try_pay(&t.shop, &2, &i128::MAX), Err(Ok(Error::InvalidAmount)));
    assert_eq!(t.client.try_pay(&t.shop, &2, &(i128::MAX / 10 + 1)), Err(Ok(Error::InvalidAmount)));
    // A fee that fits but a wallet that doesn't: the token refuses, nothing moves.
    assert!(t.client.try_pay(&t.shop, &2, &(i128::MAX / 10)).is_err());

    // Cash: the claim is only a note; confirming it would overflow the fee and is refused.
    t.client.cash_claim(&t.driver, &2, &i128::MAX);
    assert_eq!(t.client.try_cash_confirm(&t.shop, &2, &i128::MAX), Err(Ok(Error::InvalidAmount)));
    assert_eq!(t.client.get_invoice(&2).paid, 0);
    assert_eq!(t.client.get_driver_cash(&t.driver), 0);
    assert_eq!(t.client.get_usage_owed(&t.distributor), 0);
    assert_eq!(
        t.client.try_cash_handed_in(&t.distributor, &t.driver, &i128::MAX),
        Err(Ok(Error::InvalidAmount))
    );

    // Credit: the shop already owes $100, so `owed + amount` would overflow.
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &2), Err(Ok(Error::OverLimit)));
    assert_eq!(t.client.try_repay(&t.shop, &i128::MAX), Err(Ok(Error::InvalidAmount)));

    // Pool: nobody has i128::MAX dollars.
    assert!(t.client.try_deposit(&t.lender, &i128::MAX).is_err());
    assert!(t.client.try_fund_buffer(&t.lender, &i128::MAX).is_err());

    assert_eq!(t.snapshot(), before);
    assert_eq!(t.client.get_invoice(&2).status, InvoiceStatus::Due);
    t.assert_pool_matches_balance();

    // With nothing owed the shop is at 0, and the fee math refuses the huge credit sale.
    t.client.repay(&t.shop, &(100 * USD));
    assert_eq!(t.client.try_pay_with_credit(&t.shop, &2), Err(Ok(Error::InvalidAmount)));
    t.assert_pool_matches_balance();
    t.assert_nothing_overpaid();
}

#[test]
fn every_credit_fee_rate_splits_into_lenders_buffer_and_us() {
    for rate in MIN_CREDIT_FEE_BPS..=CREDIT_FEE_BPS {
        let (buffer, ours) = fee_split(rate);
        assert_eq!(LENDER_BPS + buffer + ours, rate, "{rate}");
        assert!(buffer >= 3 * ours && buffer <= 3 * ours + 3, "{rate}: {buffer}/{ours}");
    }
    assert_eq!(fee_split(150), (75, 25)); // same as before #135
    assert_eq!(fee_split(100), (38, 12)); // the odd part goes to the buffer
}

#[test]
fn credit_fee_slides_with_the_share_on_credit() {
    let a = 100 * USD;
    assert_eq!(credit_fee_bps(a, a), 150); // all on credit
    assert_eq!(credit_fee_bps(a / 2, a), 122); // half: 100 + 50 * 0.4 / 0.9 = 122.2
    assert_eq!(credit_fee_bps(a / 10, a), 100); // a tenth
    assert_eq!(credit_fee_bps(a / 20, a), 100); // below a tenth: still 1.00%
    assert_eq!(credit_fee_bps(1, a), 100);
    // Every share from 10% to 100% is between the two ends and never goes down.
    let mut last = MIN_CREDIT_FEE_BPS;
    for pct in 10..=100 {
        let rate = credit_fee_bps(a * pct / 100, a);
        assert!((MIN_CREDIT_FEE_BPS..=CREDIT_FEE_BPS).contains(&rate), "{pct}%");
        assert!(rate >= last, "{pct}%");
        last = rate;
    }
    // Huge invoices don't overflow.
    assert_eq!(credit_fee_bps(i128::MAX, i128::MAX), 150);
    assert_eq!(credit_fee_bps(i128::MAX / 2, i128::MAX), 150);
}

#[test]
fn credit_split_never_pays_out_more_than_the_invoice() {
    let big = i128::MAX / CREDIT_FEE_BPS;
    let amounts = (1..=200_000).chain([big - 1, big, 10_i128.pow(30), 10_i128.pow(36) + 7]);
    for rate in [MIN_CREDIT_FEE_BPS, 122, CREDIT_FEE_BPS] {
        let (buffer_bps, our_bps) = fee_split(rate);
        for a in amounts.clone() {
            let fee = bps(a, rate).unwrap();
            let payout = a - fee;
            let ours = bps(a, our_bps).unwrap();
            let to_buffer = bps(a, buffer_bps).unwrap();
            let lenders = fee - ours - to_buffer;

            assert!(payout >= 0 && ours >= 0 && to_buffer >= 0, "{a}");
            // Rounding down on the three parts never adds up to more than the fee,
            assert!(lenders >= 0, "{a}");
            // so what the pool gives up (payout + ours + to_buffer) is at most A.
            assert!(payout + ours + to_buffer <= a, "{a}");
        }
    }
    // One past the edge is refused, not wrapped around.
    assert_eq!(bps(big + 1, CREDIT_FEE_BPS), Err(Error::InvalidAmount));
}

#[test]
fn half_paid_up_front_pays_a_lower_fee() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 100 * USD);
    let distributor_before = t.balance(&t.distributor);

    t.client.pay(&t.shop, &1, &(50 * USD));
    let after_pay = t.balance(&t.distributor);
    assert_eq!(after_pay - distributor_before, 499_500_000); // $49.95 after the 0.10% usage fee

    t.client.pay_with_credit(&t.shop, &1);
    // $50 on credit at 1.22%: fee $0.61, the distributor gets $49.39.
    assert_eq!(t.balance(&t.distributor) - after_pay, 493_900_000);
    assert_eq!(t.client.get_invoice(&1).credit_fee, 6_100_000);
    let (buffer_bps, _) = fee_split(122);
    assert_eq!(t.client.get_pool().buffer, bps(50 * USD, buffer_bps).unwrap());
    t.assert_pool_matches_balance();
}

#[test]
fn half_up_front_waives_the_40_dollar_minimum_to_grow() {
    let t = setup();
    t.with_credit();
    // $30 invoice, $15 up front, $15 on credit: under $40, but half was paid first.
    t.invoice(1, 30 * USD);
    t.client.pay(&t.shop, &1, &(15 * USD));
    t.client.pay_with_credit(&t.shop, &1);
    t.client.repay(&t.shop, &(15 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 2_250_000_000);
}

#[test]
fn half_up_front_on_a_tiny_invoice_does_not_grow_the_limit() {
    let t = setup();
    t.with_credit();
    // $1 invoice, $0.50 up front and $0.50 on credit, repaid every week: never grows.
    for week in 0..3u64 {
        t.env.ledger().set_timestamp(START + week * WEEK);
        let id = week + 1;
        t.invoice(id, USD);
        t.client.pay(&t.shop, &id, &(USD / 2));
        t.client.pay_with_credit(&t.shop, &id);
        let owed = t.client.get_shop(&t.shop).owed;
        t.client.repay(&t.shop, &owed);
    }
    let shop = t.client.get_shop(&t.shop);
    assert_eq!((shop.on_time, shop.limit), (3, 2_000_000_000));

    // $10 on credit with half up front is enough.
    t.env.ledger().set_timestamp(START + 3 * WEEK);
    t.invoice(9, 20 * USD);
    t.client.pay(&t.shop, &9, &(10 * USD));
    t.client.pay_with_credit(&t.shop, &9);
    t.client.repay(&t.shop, &(10 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 2_250_000_000);
}

#[test]
fn one_credited_invoice_without_half_up_front_keeps_the_40_dollar_minimum() {
    let t = setup();
    t.with_credit();
    t.invoice(1, 30 * USD);
    t.invoice(2, 20 * USD);
    t.client.pay(&t.shop, &1, &(15 * USD));
    t.client.pay_with_credit(&t.shop, &1); // half up front
    t.client.pay_with_credit(&t.shop, &2); // nothing up front
    t.client.repay(&t.shop, &(35 * USD)); // $35 borrowed: under $40
    let shop = t.client.get_shop(&t.shop);
    assert_eq!((shop.on_time, shop.limit), (1, 2_000_000_000));

    // The flag resets with the cycle: a new full-credit cycle under $40 doesn't grow.
    t.env.ledger().set_timestamp(START + WEEK);
    t.invoice(3, 30 * USD);
    t.client.pay_with_credit(&t.shop, &3);
    t.client.repay(&t.shop, &(30 * USD));
    assert_eq!(t.client.get_shop(&t.shop).limit, 2_000_000_000);
}

#[test]
fn credit_never_pays_out_more_than_the_invoice_in_the_contract() {
    let t = setup();
    t.client.deposit(&t.lender, &(10_000 * USD));
    t.client.set_terms(&t.shop, &i128::MAX);
    // Small amounts, round numbers and rounding edges.
    let amounts = [1, 2, 3, 66, 67, 99, 100, 101, 133, 199, 333, 999, 9_999, 10_000, 10_001];
    let amounts = amounts.into_iter().chain([12_345_679, 400_000_000, 1_000_000_001]);
    for (id, a) in (1u64..).zip(amounts) {
        t.invoice(id, a);
        let pool_before = t.client.get_pool();
        let contract_before = t.contract_balance();

        t.client.pay_with_credit(&t.shop, &id);

        let pool = t.client.get_pool();
        let left_contract = contract_before - t.contract_balance();
        assert!(pool_before.available - pool.available <= a, "pool gave up more than {a}");
        assert!(left_contract <= a, "{a} paid out {left_contract}");
        let (_, our_bps) = fee_split(CREDIT_FEE_BPS);
        assert_eq!(left_contract, bps(a, our_bps).unwrap() + a - bps(a, CREDIT_FEE_BPS).unwrap());
        t.assert_pool_matches_balance();
    }
}

#[test]
fn contract_balance_equals_the_pool_and_only_credit_sends_money_out() {
    let t = setup();
    let mut last = t.contract_balance();
    // After every step: the books match the balance, and the balance only drops
    // when `pay_with_credit` pays a distributor.
    let mut check = |step: &str, may_pay_out: bool| {
        let now = t.contract_balance();
        let pool = t.client.get_pool();
        assert_eq!(pool.available + pool.buffer, now, "after {step}");
        assert!(pool.available >= 0 && pool.buffer >= 0, "after {step}");
        if !may_pay_out {
            assert!(now >= last, "{step} sent money out of the contract");
        }
        last = now;
    };

    t.client.deposit(&t.lender, &(5_000 * USD));
    check("deposit", false);
    t.client.fund_buffer(&t.lender, &(50 * USD));
    check("fund_buffer", false);
    t.client.set_terms(&t.shop, &(200 * USD));
    check("set_terms", false);
    t.client.approve_distributor(&t.stranger());
    check("approve_distributor", false);

    // Digital and cash payments never touch the pool.
    t.invoice(1, 150 * USD);
    check("create_invoice", false);
    t.client.pay(&t.shop, &1, &(50 * USD));
    check("pay", false);
    t.client.cash_claim(&t.driver, &1, &(50 * USD));
    check("cash_claim", false);
    t.client.cash_confirm(&t.shop, &1, &(50 * USD));
    check("cash_confirm", false);
    t.client.cash_handed_in(&t.distributor, &t.driver, &(20 * USD));
    check("cash_handed_in", false);

    // Credit: the only step that sends money out.
    t.client.pay_with_credit(&t.shop, &1);
    check("pay_with_credit", true);
    t.invoice(2, 40 * USD);
    t.client.pay_with_credit(&t.shop, &2);
    check("pay_with_credit again", true);

    // Failed calls change nothing either.
    assert!(t.client.try_pay_with_credit(&t.shop, &2).is_err());
    assert!(t.client.try_repay(&t.shop, &(1_000 * USD)).is_err());
    check("failed calls", false);

    t.client.repay(&t.shop, &(30 * USD));
    check("part repay", false);
    t.client.repay(&t.shop, &(60 * USD));
    check("full repay, on time", false);

    // A second loan that goes unpaid, a late-period default, then paying it back.
    t.invoice(3, 100 * USD);
    t.client.pay_with_credit(&t.shop, &3);
    check("pay_with_credit (third)", true);
    t.env.ledger().set_timestamp(START + 6 * WEEK);
    t.client.cover_default(&t.shop);
    check("cover_default", false);
    t.client.repay(&t.shop, &(25 * USD));
    check("repay a written-off debt", false);

    // And a late repayment on a fresh loan.
    t.client.set_terms(&t.shop, &(200 * USD));
    t.invoice(4, 100 * USD);
    t.client.pay_with_credit(&t.shop, &4);
    check("pay_with_credit (fourth)", true);
    t.env.ledger().set_timestamp(START + 8 * WEEK);
    t.client.repay(&t.shop, &(100 * USD));
    check("late repay", false);
}

#[test]
fn cash_handed_in_needs_an_approved_distributor() {
    let t = setup();
    t.invoice(1, 150 * USD);
    t.client.cash_claim(&t.driver, &1, &(100 * USD));
    t.client.cash_confirm(&t.shop, &1, &(100 * USD));
    assert_eq!(t.client.get_driver_cash(&t.driver), 100 * USD);

    // Anyone can sign for themselves, but they must be an approved distributor.
    let stranger = t.stranger();
    assert_eq!(
        t.client.try_cash_handed_in(&stranger, &t.driver, &(100 * USD)),
        Err(Ok(Error::NotApproved))
    );
    assert_eq!(t.client.try_cash_handed_in(&t.shop, &t.driver, &USD), Err(Ok(Error::NotApproved)));
    assert_eq!(t.client.get_driver_cash(&t.driver), 100 * USD);

    t.client.cash_handed_in(&t.distributor, &t.driver, &(100 * USD));
    assert_eq!(t.client.get_driver_cash(&t.driver), 0);
}

// ---------- v3: confirm binds the amount, paged history, running totals ----------

#[test]
fn confirm_fails_if_the_driver_changed_the_claim() {
    let t = setup();
    t.invoice(1, 100 * USD);
    t.client.cash_claim(&t.driver, &1, &(10 * USD));
    // The shop is shown $10. Before it taps "Confirmo", the driver swaps the claim to $90.
    t.client.cash_claim(&t.driver, &1, &(90 * USD));
    assert_eq!(t.client.try_cash_confirm(&t.shop, &1, &(10 * USD)), Err(Ok(Error::ClaimChanged)));
    assert_eq!(t.client.get_invoice(&1).paid, 0);
    assert_eq!(t.client.get_driver_cash(&t.driver), 0);
    // Only the amount the shop actually agrees to goes through.
    t.client.cash_confirm(&t.shop, &1, &(90 * USD));
    assert_eq!(t.client.get_invoice(&1).paid, 90 * USD);
    assert_eq!(t.client.get_driver_cash(&t.driver), 90 * USD);
}

fn ids(list: &Vec<Invoice>) -> std::vec::Vec<u64> {
    list.iter().map(|i| i.id).collect()
}

#[test]
fn the_whole_history_reads_a_page_at_a_time() {
    let t = setup();
    for id in 1..=75u64 {
        t.invoice(1000 + id, USD);
    }
    assert_eq!(t.client.invoice_count(), 75);

    // The old call still returns the newest 60, oldest first.
    let newest = t.client.list_invoices();
    assert_eq!(newest.len(), 60);
    assert_eq!(newest.get(0).unwrap().id, 1016);
    assert_eq!(newest.get(59).unwrap().id, 1075);

    // Pages go newest first and cover everything exactly once.
    let page1 = t.client.list_invoices_page(&75, &30);
    assert_eq!(ids(&page1), (1046..=1075u64).rev().collect::<std::vec::Vec<_>>());
    let page2 = t.client.list_invoices_page(&45, &30);
    assert_eq!(ids(&page2), (1016..=1045u64).rev().collect::<std::vec::Vec<_>>());
    let page3 = t.client.list_invoices_page(&15, &30);
    assert_eq!(ids(&page3), (1001..=1015u64).rev().collect::<std::vec::Vec<_>>());
    assert_eq!(t.client.list_invoices_page(&0, &30).len(), 0);

    // A page is never bigger than MAX_PAGE, and `before` past the end means "from the newest".
    assert_eq!(t.client.list_invoices_page(&75, &1000).len(), MAX_PAGE);
    assert_eq!(ids(&t.client.list_invoices_page(&u32::MAX, &2)), [1075, 1074]);
    assert_eq!(t.client.list_invoices_page(&75, &0).len(), 0);
}

#[test]
fn a_page_shows_what_happened_to_old_invoices() {
    let t = setup();
    for id in 1..=70u64 {
        t.invoice(id, 10 * USD);
    }
    t.client.pay(&t.shop, &1, &(10 * USD)); // older than the newest 60
    let oldest = t.client.list_invoices_page(&1, &1);
    assert_eq!(oldest.get(0).unwrap().id, 1);
    assert_eq!(oldest.get(0).unwrap().status, InvoiceStatus::Paid);
}

#[test]
fn totals_cover_every_payment_by_method() {
    let t = setup();
    t.client.deposit(&t.lender, &(1_000 * USD));
    t.client.set_terms(&t.shop, &(200 * USD));
    t.invoice(1, 100 * USD);
    t.invoice(2, 60 * USD);
    assert_eq!(t.client.get_totals(), Totals { invoices: 2, invoiced: 160 * USD, ..Totals::default() });

    // A mixed invoice counts each part under its own method.
    t.client.pay(&t.shop, &1, &(30 * USD));
    t.client.cash_claim(&t.driver, &1, &(70 * USD));
    t.client.cash_confirm(&t.shop, &1, &(70 * USD));
    t.client.pay_with_credit(&t.shop, &2);

    let totals = t.client.get_totals();
    assert_eq!(totals.digital, 30 * USD);
    assert_eq!(totals.cash, 70 * USD);
    assert_eq!(totals.credit, 60 * USD);

    // Refused calls change nothing.
    assert!(t.client.try_pay(&t.shop, &1, &USD).is_err());
    assert_eq!(t.client.get_totals(), totals);
}

#[test]
fn a_page_and_the_newest_60_stay_far_under_the_network_limits() {
    let t = setup();
    for id in 1..=120u64 {
        t.invoice(id, USD);
    }
    // Tests already enforce mainnet's per-call limits; this keeps lots of headroom.
    t.client.list_invoices_page(&100, &MAX_PAGE);
    let page = t.env.cost_estimate().resources();
    t.client.list_invoices();
    let newest = t.env.cost_estimate().resources();
    for r in [page, newest] {
        assert!(r.memory_read_entries + r.disk_read_entries < 100, "{r:?}");
        assert!(r.instructions < 100_000_000, "{r:?}");
    }
}
