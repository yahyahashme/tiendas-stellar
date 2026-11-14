#!/usr/bin/env bash
# Deploy route_ledger to testnet and load the demo: credit terms, pool money,
# a seeded loss buffer, the approved distributor and 8 invoices (#52).
# Run it right after ./scripts/setup.sh (#15):
#
#   ./scripts/setup.sh && ./scripts/deploy.sh
#   CREDIT_PERIOD_SECS=120 ./scripts/deploy.sh   # 2-minute credit, for an "overdue" demo copy
#
# Every run deploys a NEW contract and points config/testnet.json at it.
# It never prints secret keys.
set -euo pipefail
cd "$(dirname "$0")/.."

CONFIG=config/testnet.json
NETWORK=testnet
WASM=target/wasm32v1-none/release/route_ledger.wasm
WEEK=604800
PERIOD=${CREDIT_PERIOD_SECS:-$WEEK}
EXPLORER=https://stellar.expert/explorer/testnet

die() { echo "deploy.sh: $*" >&2; exit 1; }
step() { printf '\n==> %s\n' "$*"; }

command -v stellar >/dev/null || die "the stellar CLI is not installed (see #15)."
command -v node >/dev/null || die "node is not installed (Node 20 or newer)."
[ -f "$CONFIG" ] || die "$CONFIG is missing. Run ./scripts/setup.sh first."

# Print one value from the config, e.g. `config token.contractId`.
config() {
  node -e '
    const c = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const v = process.argv[2].split(".").reduce((o, k) => (o == null ? o : o[k]), c);
    process.stdout.write(v == null ? "" : String(v));
  ' "$CONFIG" "$1"
}

# Print one field of the JSON on stdin, e.g. `... | field available` or `field length`.
field() {
  node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const v = JSON.parse(s)[process.argv[1]];
      console.log(v == null ? "" : String(v));
    });
  ' "$1"
}

addr() { stellar keys address "tiendas-$1"; }

# Testnet sometimes times out: try up to 3 times, 5 seconds apart.
retry() {
  local try
  for try in 1 2 3; do
    "$@" && return 0
    [ "$try" -lt 3 ] && { echo "   (failed, trying again in 5 s)" >&2; sleep 5; }
  done
  return 1
}

# invoke <role> <function> --arg value ...   signed by tiendas-<role>
invoke() {
  local role=$1
  shift
  stellar contract invoke --id "$CONTRACT_ID" --source-account "tiendas-$role" \
    --network "$NETWORK" -- "$@"
}

# Read-only call: simulated, never sent.
view() {
  stellar contract invoke --id "$CONTRACT_ID" --source-account tiendas-admin \
    --network "$NETWORK" --send=no -- "$@"
}

# ---------- 1. Check this computer ran setup.sh ----------
ADMIN=$(addr admin 2>/dev/null) || die "no tiendas-admin key on this computer. Run ./scripts/setup.sh first."
[ "$(config accounts.admin)" = "$ADMIN" ] ||
  die "$CONFIG was made on another computer (its admin is not your tiendas-admin). Run ./scripts/setup.sh first."
TOKEN=$(config token.contractId)
[[ $TOKEN == C* ]] || die "token.contractId is missing in $CONFIG. Run ./scripts/setup.sh first."

TREASURY=$(addr treasury)
LENDER=$(addr lender)
DISTRIBUTOR=$(addr distributor)
M1=$(addr motorista-1)
M2=$(addr motorista-2)
T1=$(addr tienda-1)
T2=$(addr tienda-2)
T3=$(addr tienda-3)

# ---------- 2. Build and deploy ----------
step "Building the contract"
stellar contract build

step "Deploying route_ledger (credit period: $PERIOD seconds)"
CONTRACT_ID=$(retry stellar contract deploy --wasm "$WASM" --source-account tiendas-admin \
  --network "$NETWORK" --alias tiendas-route-ledger \
  -- --admin "$ADMIN" --token "$TOKEN" --treasury "$TREASURY" --credit_period_secs "$PERIOD" |
  tail -n 1)
[[ $CONTRACT_ID =~ ^C[A-Z2-7]{55}$ ]] || die "deploy did not print a contract ID (got: $CONTRACT_ID)."
echo "Contract: $CONTRACT_ID"

# ---------- 3. Save the ID in the config ----------
node - "$CONFIG" "$CONTRACT_ID" <<'EOF'
const fs = require("fs");
const [file, id] = process.argv.slice(2);
const c = JSON.parse(fs.readFileSync(file, "utf8"));
c.contracts = { ...(c.contracts || {}), routeLedger: id };
fs.writeFileSync(file, JSON.stringify(c, null, 2) + "\n");
EOF
echo "Saved to $CONFIG as contracts.routeLedger"

# ---------- 4. Credit terms ----------
step "Credit terms: a \$200 limit for each shop"
for shop in "$T1" "$T2" "$T3"; do
  retry invoke admin set_terms --shop "$shop" --limit 2000000000
done

# ---------- 5. Pool money ----------
step "Approving the demo lender (only approved lenders can put money in the pool)"
retry invoke admin approve_lender --lender "$LENDER"

step "The lender puts \$5,000 in the pool"
deposit_once() {
  invoke lender deposit --lender "$LENDER" --amount 50000000000 && return 0
  # Money moved if this went through before a timeout: check before trying again.
  [ "$(view get_pool | field available)" = "50000000000" ]
}
retry deposit_once

step "The lender seeds the loss buffer with \$50"
buffer_once() {
  invoke lender fund_buffer --from "$LENDER" --amount 500000000 && return 0
  [ "$(view get_pool | field buffer)" = "500000000" ]
}
retry buffer_once

step "Approving the demo distributor (only approved distributors can invoice)"
retry invoke admin approve_distributor --distributor "$DISTRIBUTOR"

# ---------- 6. Demo invoices ----------
step "Creating the 8 demo invoices (due in 7 days)"
DUE=$(($(date +%s) + WEEK))
create() { # create <id> <shop> <driver> <units>
  invoke distributor create_invoice --distributor "$DISTRIBUTOR" --id "$1" \
    --shop "$2" --driver "$3" --amount "$4" --due "$DUE" && return 0
  view get_invoice --id "$1" >/dev/null 2>&1 # it went through before a timeout
}
retry create 1001 "$T1" "$M1" 1500000000 # $150.00
retry create 1002 "$T2" "$M1" 855000000  # $85.50
retry create 1003 "$T3" "$M2" 2200000000 # $220.00, over the $200 limit on purpose
retry create 1004 "$T1" "$M1" 600000000  # $60.00
retry create 1005 "$T2" "$M2" 1300000000 # $130.00
retry create 1006 "$T3" "$M2" 952500000  # $95.25
retry create 1007 "$T1" "$M1" 400000000  # $40.00
retry create 1008 "$T2" "$M1" 1750000000 # $175.00

# ---------- 7. Check and print ----------
step "Done"
COUNT=$(view list_invoices | field length)
ROW_CONTRACT="| \`route_ledger\` contract | \`$CONTRACT_ID\` | [stellar.expert]($EXPLORER/contract/$CONTRACT_ID) |"
ROW_TOKEN="| Test USDC token | \`$TOKEN\` | [stellar.expert]($EXPLORER/contract/$TOKEN) |"
echo "Invoices on the contract: $COUNT (expected 8)"
echo "Explorer: $EXPLORER/contract/$CONTRACT_ID"
echo "Events:   stellar events --id $CONTRACT_ID --network testnet --output json --count 20"
echo
echo "README rows:"
echo "$ROW_CONTRACT"
echo "$ROW_TOKEN"

# ---------- 8. README "Contract IDs" table ----------
if [ "$PERIOD" != "$WEEK" ]; then
  echo
  echo "README not changed: this is a $PERIOD-second demo copy. Rerun without CREDIT_PERIOD_SECS to go back."
  exit 0
fi
node - "$ROW_CONTRACT" "$ROW_TOKEN" "$(date -u +%Y-%m-%d)" <<'EOF'
const fs = require("fs");
const [rowContract, rowToken, date] = process.argv.slice(2);
const START = "<!-- contract-ids:start -->";
const END = "<!-- contract-ids:end -->";
const block = [
  START,
  "## Contract IDs",
  "",
  `Stellar testnet, deployed ${date} by \`scripts/deploy.sh\`.`,
  "",
  "| What | ID | Explorer |",
  "|---|---|---|",
  rowContract,
  rowToken,
  "",
  "Test USDC is our own, issued by `tiendas-issuer`, not Circle's.",
  END,
].join("\n");
let md = fs.readFileSync("README.md", "utf8");
const at = md.indexOf(START);
const end = md.indexOf(END);
if (at >= 0 && end > at) {
  md = md.slice(0, at) + block + md.slice(end + END.length);
} else {
  const anchor = "## Never commit secret keys";
  md = md.includes(anchor)
    ? md.replace(anchor, `${block}\n\n${anchor}`)
    : `${md.trimEnd()}\n\n${block}\n`;
}
fs.writeFileSync("README.md", md);
EOF
echo
echo "README.md \"Contract IDs\" table updated. Commit config/testnet.json and README.md."
