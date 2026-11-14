"use client";

import { useParams } from "next/navigation";
import { ShopHistory } from "@/components/shop-history";
import { useT } from "@/lib/i18n";

/** The shop's own history, from Mi cuenta. */
export default function HistoryScreen() {
  const { shopId } = useParams<{ shopId: string }>();
  const { t } = useT();
  return <ShopHistory shopId={shopId} backHref={`/tienda/cuenta/${shopId}`} backLabel={t("Mi cuenta", "My account")} />;
}
