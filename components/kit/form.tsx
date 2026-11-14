"use client";

import { type FormHTMLAttributes, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Button } from "./button";
import { FormError } from "./field";

// What a form needs besides its blanks: a head that says which step this is, choices you tap instead
// of type, and one line above the button for what went wrong or what is happening.

/**
 * The class of a form: its blanks 16 px apart. When the phone brings a blank into view, the message
 * line and the button under it come too (the blanks' own margin stops short of the message line).
 * Use `Form`, which has it.
 */
export const FORM = "flex flex-col gap-4 [&_input]:scroll-mb-40";

/**
 * A form that shows where its message is. `error` is what went wrong, if anything. A message under a blank
 * can be a screen above the button that was pressed: the blank comes to the middle of the screen with the
 * cursor in it. A message that is in view already (the line above the button) moves nothing.
 */
export function Form({ error, onSubmit, children, ...form }: { error?: unknown } & Omit<FormHTMLAttributes<HTMLFormElement>, "className">) {
  const ref = useRef<HTMLFormElement>(null);
  // Counts the sends, so the same message twice in a row still shows where it is.
  const [sent, setSent] = useState(0);
  useEffect(() => {
    if (!error) return;
    const blank = ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    blank?.focus({ preventScroll: true });
    const shown = blank ?? ref.current?.querySelector<HTMLElement>('[role="alert"]');
    if (!shown) return;
    const box = shown.getBoundingClientRect();
    const height = window.visualViewport?.height ?? window.innerHeight;
    // 96 px: clear of the band at the top, with room for the blank's label.
    if (box.top < 96 || box.bottom > height - 24) shown.scrollIntoView({ block: "center" });
  }, [error, sent]);
  return (
    <form
      ref={ref}
      className={FORM}
      onSubmit={(event) => {
        setSent((n) => n + 1);
        onSubmit?.(event);
      }}
      {...form}
    >
      {children}
    </form>
  );
}

/**
 * The head of a screen you fill in: where you are ("Crear cuenta · Paso 1 de 4"), its name, one sentence.
 * `at` is the step's number. When the step changes, its name takes the focus, so a screen reader says the
 * new step and the Tab key starts at its first blank (the button that was pressed is gone).
 */
export function FormHead({ step, at, title, children }: { step?: ReactNode; at?: number; title: ReactNode; children?: ReactNode }) {
  const name = useRef<HTMLHeadingElement>(null);
  const was = useRef<number | undefined>(undefined);
  useEffect(() => {
    const from = was.current;
    was.current = at;
    // Nothing moves when the page has just opened on its first step.
    if (at === undefined || from === at || (from === undefined && at === 1)) return;
    name.current?.focus({ preventScroll: true });
  }, [at]);
  return (
    <header className="flex flex-col gap-1.5">
      {step && <p className="text-label font-semibold uppercase tracking-[0.1em] text-muted">{step}</p>}
      <h1 ref={name} tabIndex={-1} className="text-title font-bold text-balance outline-none">
        {title}
      </h1>
      {children && <p className="text-lead text-muted text-pretty">{children}</p>}
    </header>
  );
}

/**
 * Choices you tap instead of type ("¿Qué vende?"): outlined blue while off, filled blue once chosen.
 * The error, in words, goes under the group like under any blank.
 */
export function Choices({ label, error, children }: { label: ReactNode; error?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5" aria-describedby={error ? `${id}-note` : undefined}>
      <legend className="mb-1.5 text-[1.0625rem] font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {error && (
        <p id={`${id}-note`} role="alert" className="font-semibold text-bad">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** One choice of the group. `chosen` is spoken as pressed. */
export function Choice({ chosen, onClick, children }: { chosen: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onClick}
      className={`min-h-12 rounded-control border-[1.5px] border-brand px-4 text-[1.0625rem] font-bold transition-[scale,background-color] duration-[120ms] ease-snap select-none active:scale-[0.97] ${
        chosen ? "bg-brand text-white" : "text-brand hover:bg-brand/6 active:bg-brand/10"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The end of a form: one line of news, then the button. The line is what went wrong with the whole form
 * (a problem with one blank goes under that blank instead), or what is happening while it is sent.
 * Room for two lines is always there, so a message never pushes the button out from under the thumb.
 */
export function FormSubmit({ children, error, note, busy = false, disabled = false }: { children: ReactNode; error?: ReactNode; note?: ReactNode; busy?: boolean; disabled?: boolean }) {
  return (
    <div className="-mt-2 flex flex-col gap-2">
      {/* 3em = two lines of body text, whatever size the text is on this screen. */}
      <div className="flex min-h-[3em] flex-col justify-end text-pretty">
        {error ? (
          <FormError>{error}</FormError>
        ) : (
          note && (
            <p role="status" className="text-muted">
              {note}
            </p>
          )
        )}
      </div>
      <Button type="submit" busy={busy} disabled={disabled}>
        {children}
      </Button>
    </div>
  );
}
