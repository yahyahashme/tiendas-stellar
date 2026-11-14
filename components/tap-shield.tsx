"use client";

import { type MouseEvent, type PointerEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { isStrayTap, type Tap } from "@/lib/taps";

/** How long a screen stays held after a payment lands. */
export const QUIET_MS = 900;

/**
 * The longer hold, for a screen that looks different once the payment lands (buttons gone, others moved up,
 * a link where a button was). Longer than two seconds, so taps repeated every second or two all stop on the shield.
 */
export const HOLD_MS = 2200;

/**
 * A payment changes what sits under the thumb: one button goes away and something else takes its place.
 * While the payment runs, <TapShield> covers the screen and notes every tap. `settle()` then waits one
 * beat (or `settle(HOLD_MS)`, a longer one), and longer while the taps keep coming, so a repeat tap can't
 * land on whatever comes next.
 */
export function useTapShield() {
  const lastTap = useRef(0);
  const noteTap = () => {
    lastTap.current = Date.now();
  };
  const settle = async (quiet = QUIET_MS) => {
    let wait = quiet;
    while (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
      wait = lastTap.current + quiet - Date.now();
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

type Seen = Tap & { target: EventTarget | null };

/**
 * The screen can move under a thumb without any payment: a panel opens, a row slides up, the page scrolls.
 * A tap that lands on a pay button exactly where the tap before it landed on something else was aimed at
 * what used to be there, so it must not pay (lib/taps.ts has the rule).
 *
 * Put `watch` and `typed` on the screen's wrapper (onPointerDownCapture, onInputCapture) and ask
 * `stray(event)` first in every pay button's onClick. Two taps on the same button are not stray (the shield
 * takes the second), and neither is a tap after typing (an amount was entered on purpose) or the keyboard.
 */
export function useSameSpotGuard() {
  const taps = useRef<{ last: Seen | null; before: Seen | null }>({ last: null, before: null });
  const watch = (event: PointerEvent) => {
    taps.current = { before: taps.current.last, last: { x: event.clientX, y: event.clientY, at: Date.now(), target: event.target } };
  };
  const typed = () => {
    taps.current = { before: null, last: null };
  };
  const stray = (event: MouseEvent<HTMLElement>): boolean => {
    if (event.detail === 0) return false; // the keyboard
    const { last, before } = taps.current;
    const onSameButton = before?.target instanceof Node && event.currentTarget.contains(before.target);
    return isStrayTap(before, last, onSameButton);
  };
  return { watch, typed, stray };
}

/**
 * A refresh can add or take away rows above a button, so the button moves while a thumb is already on its way
 * and the tap lands on its neighbour. Put `ref` on the block that holds the buttons and ask `justMoved()` first
 * in their onClick: it is true for a beat after the block changed place on the page (scrolling doesn't count).
 */
export function useMovedGuard<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const place = useRef<{ top: number | null; movedAt: number }>({ top: null, movedAt: 0 });
  // After every render, before the browser paints it: where does the block sit on the page now?
  useLayoutEffect(() => {
    let top = 0;
    for (let node: HTMLElement | null = ref.current; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
    if (!ref.current) return;
    if (place.current.top !== null && place.current.top !== top) place.current.movedAt = Date.now();
    place.current.top = top;
  });
  const justMoved = () => Date.now() - place.current.movedAt < ARRIVE_MS;
  return { ref, justMoved };
}

/**
 * For an action that asks for a second tap ("Toque otra vez"): the second tap of a double tap is not a second
 * thought, so it only counts a beat after the first. Call `asked()` on the first tap; drop a tap while `tooSoon()`.
 */
export function useSecondTap() {
  const at = useRef(0);
  return {
    asked: () => {
      at.current = Date.now();
    },
    tooSoon: () => Date.now() - at.current < ARRIVE_MS,
  };
}
