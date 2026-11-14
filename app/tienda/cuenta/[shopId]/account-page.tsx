"use client";

import type { ReactNode } from "react";
import { Slip, TopNav } from "@/components/kit/layout";
import { useT } from "@/lib/i18n";

/**
 * A page that hangs off Mi cuenta (Datos, an explainer): one slip-wide column with the way back above it.
 * Without `shopId` (the page is still finding out which shop it is) the row is kept, empty, so nothing jumps.
 */
export function AccountPage({ shopId, children }: { shopId?: string; children: ReactNode }) {
  const { t } = useT();
  return (
    <Slip>
      <TopNav back={shopId ? `/tienda/cuenta/${shopId}` : undefined} backLabel={t("Mi cuenta", "My account")} />
      {children}
    </Slip>
  );
}
