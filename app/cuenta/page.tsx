"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type CurrentUser, getCurrentUser, signOutAction } from "@/app/auth-actions";
import { getMyDriverId } from "@/app/driver-actions";
import { getMyShopId } from "@/app/shop-actions";
import { BackLink, Button, ButtonLink, Card, Label, Loading, Screen } from "@/components/ui";
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

/** The signed-in person's account (#129). The role screens build on this (#130, #131, #134). */
export default function Account() {
  const { t } = useT();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [leaving, setLeaving] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);

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
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackLink />
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{t(`Hola, ${user.name}`, `Hi, ${user.name}`)}</h1>
        <p className="text-lg text-muted">{t("Su cuenta está lista.", "Your account is ready.")}</p>
      </header>

      <Card className="flex flex-col gap-4">
        <div>
          <Label>{t("Tipo de cuenta", "Account type")}</Label>
          <p className="text-lg font-semibold">{t(...ROLE_LABEL[user.role])}</p>
        </div>
        <div>
          <Label>{t("Teléfono o correo", "Phone or email")}</Label>
          <p className="text-lg font-semibold break-all">{formatPhone(user.contact)}</p>
        </div>
        <div>
          <Label>{t("Cuenta de dólares digitales", "Digital dollar account")}</Label>
          <p className="text-lg font-semibold tabular-nums">{short(user.stellarAddress)}</p>
          <a href={user.explorerUrl} target="_blank" rel="noreferrer" className="text-sm text-brand underline">
            {t("Ver detalles", "View details")}
          </a>
        </div>
      </Card>

      {user.role === "distribuidora" && <ButtonLink href="/distribuidor/espera">{t("Ir a mi panel", "Go to my dashboard")}</ButtonLink>}
      {user.role === "motorista" && driverId && <ButtonLink href={`/ruta/${driverId}`}>{t("Ir a mi ruta", "Go to my route")}</ButtonLink>}
      {user.role === "tienda" && shopId && <ButtonLink href={`/tienda/cuenta/${shopId}`}>{t("Ir a mi tienda", "Go to my shop")}</ButtonLink>}
      {user.role === "admin" && <ButtonLink href="/admin">{t("Distribuidoras por aprobar", "Distributors to approve")}</ButtonLink>}
      <ButtonLink href="/" variant="secondary">
        {t("Ir al inicio", "Go to the home page")}
      </ButtonLink>
      <Button onClick={signOut} busy={leaving} variant="secondary">
        {t("Cerrar sesión", "Sign out")}
      </Button>
    </Screen>
  );
}
