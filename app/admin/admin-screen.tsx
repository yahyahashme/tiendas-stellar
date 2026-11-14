"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { type AdminRow, adminDecide, getAdminList } from "@/app/distributor-actions";
import { ActionLink, DetailLink } from "@/components/kit/button";
import { Slip, TopNav } from "@/components/kit/layout";
import { Ledger, LedgerCard, type LedgerColumn, RowAction, RowButton } from "@/components/kit/ledger";
import { Stamp } from "@/components/kit/stamp";
import { Empty, Failure, Loading } from "@/components/kit/states";
import { HOLD_MS, TapShield, useConfirmGap, useMovedGuard, useTapShield } from "@/components/tap-shield";
import { formatDay } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { sellLabel } from "@/lib/sells";

type List = { pending: AdminRow[]; decided: AdminRow[] };

const HEADING = "text-lead leading-tight font-bold";
const SECTION = "flex flex-col gap-2";

/**
 * The page's frame: one ledger column on the counter. It stays under 60 rem on purpose: the ledger then keeps
 * what identifies a business as columns and holds the rest of its form in each row's fold.
 */
function Frame({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <main className="mx-auto flex w-full max-w-[calc(58rem+2*var(--gutter))] flex-1 flex-col gap-4 pt-1 pr-[max(var(--gutter),env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(var(--gutter),env(safe-area-inset-left))]">
      <TopNav back="/" backLabel={t("Inicio", "Home")} />
      {children}
    </main>
  );
}

/** Relay admins approve or reject distributors (#130). "Aprobar" also approves the address on the contract. */
export default function AdminScreen() {
  const { lang, t, msg } = useT();
  const [list, setList] = useState<List | null | undefined>(undefined);
  const [busy, setBusy] = useState<{ id: string; status: "aprobado" | "rechazado" } | null>(null);
  const running = useRef(false);
  const [held, setHeld] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { noteTap, settle } = useTapShield();
  const { ref: pendingBlock, justMoved } = useMovedGuard<HTMLElement>();
  const { ask, tooSoon } = useConfirmGap();

  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => setList(await getAdminList()), []);
  useEffect(() => {
    let live = true;
    getAdminList().then(
      (found) => live && setList(found),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);
  async function retry() {
    setRetrying(true);
    try {
      await load();
      setFailed(false);
    } catch {
      setFailed(true);
    }
    setRetrying(false);
  }

  async function decide(id: string, status: "aprobado" | "rechazado") {
    if (running.current || justMoved()) return;
    // Rejecting can't be taken back from here, so it asks for a second tap.
    if (status === "rechazado" && confirming !== id) {
      ask();
      setConfirming(id);
      setTimeout(() => setConfirming((c) => (c === id ? null : c)), 4000);
      return;
    }
    // The second half of a double tap is not the answer.
    if (status === "rechazado" && tooSoon()) return;
    running.current = true;
    setConfirming(null);
    setBusy({ id, status });
    setError(null);
    try {
      const reply = await adminDecide(id, status);
      if (!reply.ok) setError(reply.message);
      await load();
    } catch {
      setError("No se pudo completar. Intente de nuevo.");
    }
    // The row is gone and the next business has moved up under the same button: hold every tap until the taps have stopped.
    setHeld(true);
    setBusy(null);
    await settle(HOLD_MS);
    setHeld(false);
    running.current = false;
  }

  if (list === undefined) {
    return (
      <Frame>
        <h1 className="text-title font-bold">{t("Distribuidoras por aprobar", "Distributors to approve")}</h1>
        {failed ? (
          <div className="max-w-[34rem]">
            <Failure onRetry={() => void retry()} busy={retrying} />
          </div>
        ) : (
          <Loading lines={6} torn={false} />
        )}
      </Frame>
    );
  }

  if (list === null) {
    return (
      <Slip>
        <TopNav back="/" backLabel={t("Inicio", "Home")} />
        <h1 className="text-title font-bold">{t("Administración", "Administration")}</h1>
        <Empty action={<ActionLink href="/entrar" title={t("Entrar", "Sign in")} />}>{t("Solo para administradores de Relay.", "Relay administrators only.")}</Empty>
      </Slip>
    );
  }

  const locked = busy !== null || held;
  const decideCell = (d: AdminRow) => (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-1">
      <RowButton onClick={() => void decide(d.id, "aprobado")} disabled={locked} busy={busy?.id === d.id && busy.status === "aprobado"} label={t(`Aprobar ${d.businessName}`, `Approve ${d.businessName}`)}>
        {t("Aprobar", "Approve")}
      </RowButton>
      <RowAction onClick={() => void decide(d.id, "rechazado")} danger label={confirming === d.id ? undefined : t(`Rechazar ${d.businessName}`, `Reject ${d.businessName}`)}>
        {busy?.id === d.id && busy.status === "rechazado" ? t("Procesando...", "Processing...") : confirming === d.id ? t("Toque otra vez", "Tap again") : t("Rechazar", "Reject")}
      </RowAction>
    </span>
  );
  const size = (d: AdminRow) => t(`${d.shopsApprox ?? "?"} tiendas · ${d.driversApprox ?? "?"} motoristas`, `${d.shopsApprox ?? "?"} shops · ${d.driversApprox ?? "?"} drivers`);
  const pendingColumns: LedgerColumn<AdminRow>[] = [
    { id: "name", header: t("Distribuidora", "Distributor"), grow: true, cell: (d) => d.businessName, title: (d) => d.businessName },
    { id: "nit", header: t("NIT", "Tax ID (NIT)"), mono: true, secondary: 54, cell: (d) => d.nit ?? "—" },
    { id: "size", header: t("Tamaño (aprox.)", "Size (approx.)"), secondary: true, cell: size },
    { id: "address", header: t("Dirección", "Address"), secondary: true, cell: (d) => d.address ?? "—" },
    { id: "contact", header: t("Contacto", "Contact"), secondary: true, cell: (d) => <span className="break-all">{`${d.ownerName ?? "—"} · ${d.ownerContact ?? "—"}`}</span> },
    { id: "sells", header: t("¿Qué vende?", "What do you sell?"), secondary: true, cell: (d) => d.sells.map((s) => sellLabel(s, lang)).join(", ") || "—" },
    {
      id: "account",
      header: t("Cuenta", "Account"),
      secondary: true,
      cell: (d) => (
        <DetailLink href={d.explorerUrl} external>
          {t("Ver detalles", "View details")}
        </DetailLink>
      ),
    },
    { id: "created", header: t("Registrada", "Signed up"), mono: true, end: true, cell: (d) => formatDay(d.createdAt, lang) },
    // One width whatever it says, so the other columns never move sideways.
    { id: "decide", header: <span className="sr-only">{t("Decisión", "Decision")}</span>, end: true, className: "w-60 min-w-60 py-1", cell: decideCell },
  ];
  const stamp = (d: AdminRow) =>
    d.status === "aprobado" ? (
      <Stamp small tone="ok">
        {t("Aprobada", "Approved")}
      </Stamp>
    ) : (
      <Stamp small tone="bad">
        {t("Rechazada", "Rejected")}
      </Stamp>
    );
  const decidedColumns: LedgerColumn<AdminRow>[] = [
    { id: "name", header: t("Distribuidora", "Distributor"), grow: true, cell: (d) => d.businessName, title: (d) => d.businessName },
    { id: "status", header: t("Estado", "Status"), cell: stamp },
    { id: "created", header: t("Registrada", "Signed up"), mono: true, end: true, cell: (d) => formatDay(d.createdAt, lang) },
  ];

  return (
    <Frame>
      {locked && <TapShield onTap={noteTap} />}
      <h1 className="text-title font-bold">{t("Distribuidoras por aprobar", "Distributors to approve")}</h1>

      <section ref={pendingBlock} className={SECTION}>
        <Ledger
          label={t("Distribuidoras por aprobar", "Distributors to approve")}
          columns={pendingColumns}
          rows={list.pending}
          rowKey={(d) => d.id}
          rowName={(d) => d.businessName}
          card={(d) => (
            <LedgerCard
              title={d.businessName}
              amount={null}
              stamp={<span className="font-mono text-label font-medium text-muted">{[d.nit ? `NIT ${d.nit}` : "", `${t("Registrada", "Signed up")} ${formatDay(d.createdAt, lang)}`].filter(Boolean).join(" · ")}</span>}
              actions={<span className="flex justify-start">{decideCell(d)}</span>}
            />
          )}
          empty={<p className="text-lead">{t("No hay distribuidoras esperando.", "No distributors are waiting.")}</p>}
        />
        {/* Its place is always there, so the news never moves a row. */}
        <p role="alert" className="min-h-[1lh] font-semibold text-bad">
          {error && msg(error)}
        </p>
      </section>

      {list.decided.length > 0 && (
        <section className={`${SECTION} max-w-[40rem]`}>
          <h2 className={HEADING}>{t("Decididas", "Decided")}</h2>
          <Ledger
            label={t("Decididas", "Decided")}
            columns={decidedColumns}
            rows={list.decided}
            rowKey={(d) => d.id}
            card={(d) => <LedgerCard title={d.businessName} amount={null} stamp={stamp(d)} note={`${t("Registrada", "Signed up")} ${formatDay(d.createdAt, lang)}`} />}
          />
        </section>
      )}
    </Frame>
  );
}
