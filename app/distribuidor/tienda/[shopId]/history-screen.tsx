"use client";

import { useParams } from "next/navigation";
import { ShopHistory } from "@/components/shop-history";

/** A shop's history as its distributor sees it (only this distributor's invoices; the demo has one). */
export default function HistoryScreen() {
  const { shopId } = useParams<{ shopId: string }>();
  return <ShopHistory shopId={shopId} backHref="/distribuidor" backLabel="Distribuidora El Sol" />;
}
