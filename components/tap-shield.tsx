"use client";

import { useEffect, useRef, useState } from "react";

/** How long a screen stays held after a payment lands. */
export const QUIET_MS = 900;

/**
 * A payment changes what sits under the thumb: one button goes away and something else takes its place.
 * While the payment runs, <TapShield> covers the screen and notes every tap. `settle()` then waits one
 * beat, and longer while the taps keep coming, so a repeat tap can't land on whatever comes next.
 */
export function useTapShield() {
  const lastTap = useRef(0);
  const noteTap = () => {
    lastTap.current = Date.now();
  };
  const settle = async () => {
    let wait = QUIET_MS;
    while (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
      wait = lastTap.current + QUIET_MS - Date.now();
    }
  };
  return { noteTap, settle };
}

/** Invisible, and only on screen while a payment runs. Scrolling still works through it. */
export function TapShield({ onTap }: { onTap?: () => void }) {
  return <div aria-hidden className="fixed inset-0 z-10" onPointerDown={onTap} />;
}

/** How long a pay button stays inert after it comes on screen: longer than a double tap. */
export const ARRIVE_MS = 600;

/**
 * True for a beat each time `shown` turns true, the first time included. A pay button that has just come
 * on screen stays inert for that beat, so the second tap of a double tap on the screen before can't pay.
 */
export function useQuietOnArrival(shown: boolean): boolean {
  const [state, setState] = useState({ shown: false, quiet: false });
  if (state.shown !== shown) setState({ shown, quiet: shown });
  useEffect(() => {
    if (!state.quiet) return;
    const timer = setTimeout(() => setState((now) => ({ ...now, quiet: false })), ARRIVE_MS);
    return () => clearTimeout(timer);
  }, [state]);
  return state.quiet;
}
