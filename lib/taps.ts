// The screen can move under a thumb without any payment: a panel opens, a row slides up, the page scrolls.
// A tap that lands on a pay button exactly where the tap before it landed on something else was aimed at
// what used to be there, so it must not pay. (The hook that uses this is useSameSpotGuard in components/tap-shield.tsx.)

export type Tap = { x: number; y: number; at: number };

export const SAME_SPOT_PX = 28;
export const SAME_SPOT_MS = 2500;

/**
 * Was `last` (a tap on a pay button) meant for something else? True when the tap before it was at the same
 * spot, a moment ago, and on a different element. `onSameButton`: the tap before was on this same button
 * (a double tap, which the tap shield handles).
 */
export function isStrayTap(before: Tap | null, last: Tap | null, onSameButton: boolean): boolean {
  if (!before || !last || onSameButton) return false;
  if (last.at - before.at > SAME_SPOT_MS) return false;
  return Math.hypot(last.x - before.x, last.y - before.y) <= SAME_SPOT_PX;
}
