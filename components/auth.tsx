"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TopNav } from "@/components/kit/layout";
import { Receipt, ReceiptFoot, ReceiptHeader, ReceiptRule } from "@/components/kit/paper";
import { Stamp, type StampTone } from "@/components/kit/stamp";
import { Logo } from "@/components/logo";
import { useT } from "@/lib/i18n";

// The pieces the sign-up, sign-in and first-time setup screens share.

/** The row above a sign-up or sign-in screen: the way home on the left, whose app this is on the right. */
export function HomeNav() {
  const { t } = useT();
  return (
    <TopNav back="/" backLabel={t("Inicio", "Home")}>
      <Logo className="h-7 w-auto" />
    </TopNav>
  );
}

/** The same row for someone who arrived by a link from their distributor: there is nowhere to go back to. */
export function Brand() {
  return (
    <div className="flex min-h-12 items-center">
      <Logo className="h-8 w-auto" />
    </div>
  );
}

/** A question and its way out, under a form: "¿Ya tiene cuenta? Entrar". The link is a full-size target. */
export function AltLink({ question, href, children }: { question: ReactNode; href: string; children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 text-center">
      <span>{question}</span>
      <Link href={href} className="inline-flex min-h-12 items-center px-1 text-[1.0625rem] font-bold text-brand underline decoration-2 underline-offset-4">
        {children}
      </Link>
    </p>
  );
}

/**
 * A slip that says where something stands: whose it is, what happened in words, what happens next,
 * and its stamp ("En revisión", "No válido"). The words are the screen's heading.
 */
export function StatusSlip({
  from,
  kind,
  title,
  children,
  stamp,
  tone = "ink",
}: {
  /** Who the slip is about, printed like a receipt's header. */
  from?: ReactNode;
  /** A mono line under it: what kind of slip this is. */
  kind?: ReactNode;
  title: ReactNode;
  /** One sentence on what happens next. */
  children: ReactNode;
  /** The word on the stamp. A long one shrinks to the slip on a narrow phone. */
  stamp: string;
  tone?: StampTone;
}) {
  return (
    <Receipt>
      {from && (
        <>
          <ReceiptHeader from={from} number={kind} />
          <ReceiptRule />
        </>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-bold text-balance">{title}</h1>
        <p className="text-lead text-pretty">{children}</p>
      </div>
      <ReceiptFoot
        stamp={
          <Stamp tone={tone} fit={stamp.length}>
            {stamp}
          </Stamp>
        }
      />
    </Receipt>
  );
}
