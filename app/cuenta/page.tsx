"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { type CurrentUser, getCurrentUser, signOutAction } from "@/app/auth-actions";
import { getMyDriverId } from "@/app/driver-actions";
import { getMyShopId } from "@/app/shop-actions";
import { HomeNav } from "@/components/auth";
import { ActionLink, ActionList, ActionRow, ButtonLink, DetailLink, Held } from "@/components/kit/button";
import { FormHead } from "@/components/kit/form";
import { Slip } from "@/components/kit/layout";
import { Paper } from "@/components/kit/paper";
import { Loading } from "@/components/kit/states";
import { formatPhone } from "@/lib/format";
import { useT } from "@/lib/i18n";

const ROLE_LABEL: Record<CurrentUser["role"], [string, string]> = {
  tienda: ["Tienda", "Shop"],
  distribuidora: ["Distribuidora", "Distributor"],
  motorista: ["Motorista", "Driver"],
  admin: ["Administrador", "Administrator"],
};

/** "GDX3…U7" for a long address. */
const short = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;

/** One fact of the account: its name in small capitals, the fact under it. */
function Fact({ label, mono = false, children }: { label: ReactNode; mono?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-label font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className={`text-lead font-semibold break-all ${mono ? "font-mono" : ""}`}>{children}</dd>
    </div>
  );
}

/** The signed-in person's account (#129): who they are on paper, then the way to their own screen. */
export default function Account() {
  const { t } = useT();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [leaving, setLeaving] = useState(false);
  // undefined while we ask, null when there is none.
  const [driverId, setDriverId] = useState<string | null | undefined>(undefined);
  const [shopId, setShopId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    void getCurrentUser().then((found) => {
      if (!live) return;
      if (!found) router.replace("/entrar");
      else setUser(found);
      if (found?.role === "motorista") void getMyDriverId().then((id) => live && setDriverId(id));
      if (found?.role === "tienda") void getMyShopId().then((id) => live && setShopId(id));
    });
    return () => {
      live = false;
    };
  }, [router]);

  async function signOut() {
    setLeaving(true);
    await signOutAction();
    router.replace("/");
  }

  if (!user) {
    return (
      <Slip>
        <HomeNav />
        <Loading />
      </Slip>
    );
  }

  // The way to the person's own screen. While we look it up, something inert holds its place,
  // so the rows under it don't move up under a thumb.
  const waiting = <Held>{t("Cargando...", "Loading...")}</Held>;
  const own =
    user.role === "distribuidora" ? (
      <ButtonLink href="/distribuidor/espera">{t("Ir a mi panel", "Go to my dashboard")}</ButtonLink>
    ) : user.role === "motorista" ? (
      driverId ? (
        <ButtonLink href={`/ruta/${driverId}`}>{t("Ir a mi ruta", "Go to my route")}</ButtonLink>
      ) : (
        driverId === undefined && waiting
      )
    ) : user.role === "tienda" ? (
      shopId ? (
        <ButtonLink href={`/tienda/cuenta/${shopId}`}>{t("Ir a mi tienda", "Go to my shop")}</ButtonLink>
      ) : (
        shopId === undefined && waiting
      )
    ) : (
      <ButtonLink href="/admin">{t("Distribuidoras por aprobar", "Distributors to approve")}</ButtonLink>
    );

  return (
    <Slip>
      <HomeNav />
      <FormHead title={t(`Hola, ${user.name}`, `Hi, ${user.name}`)}>{t("Su cuenta está lista.", "Your account is ready.")}</FormHead>

      <Paper className="px-4 py-4">
        <dl className="flex flex-col gap-3">
          <Fact label={t("Tipo de cuenta", "Account type")}>{t(...ROLE_LABEL[user.role])}</Fact>
          <Fact label={t("Teléfono o correo", "Phone or email")} mono={user.contact.startsWith("+")}>
            {formatPhone(user.contact)}
          </Fact>
          <Fact label={t("Cuenta de dólares digitales", "Digital dollar account")} mono>
            {short(user.stellarAddress)}
          </Fact>
        </dl>
        <DetailLink href={user.explorerUrl} external>
          {t("Ver detalles", "See details")}
        </DetailLink>
      </Paper>

      {own}
      <ActionList>
        <ActionLink href="/" title={t("Ir al inicio", "Go to the home page")} />
        <ActionRow title={leaving ? t("Procesando...", "Processing...") : t("Cerrar sesión", "Sign out")} onClick={signOut} disabled={leaving} />
      </ActionList>
    </Slip>
  );
}
