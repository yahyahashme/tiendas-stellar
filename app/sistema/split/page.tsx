"use client";

import { NavLink, Split, TopNav } from "@/components/kit/layout";
import { useT } from "@/lib/i18n";
import { InvoiceReceipt, PayActions } from "../samples";

// The Split layout with sample content: the receipt on paper, the pay actions beside it.
export default function SplitSample() {
  const { t } = useT();
  return (
    <Split
      nav={
        <TopNav back="/sistema" backLabel={t("Sistema", "System")}>
          <NavLink href="/sistema">{t("Mi cuenta", "My account")}</NavLink>
        </TopNav>
      }
      facts={<InvoiceReceipt lines />}
      actions={<PayActions />}
    />
  );
}
