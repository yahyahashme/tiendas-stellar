"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const REFRESH_MS = 5000;

/**
 * Load data now and again every `intervalMs` (0 = only once). Old data stays
 * on screen while a refresh is running, a slow load is never doubled up, and
 * the timer stops when the page closes. `key` names what is loaded (e.g. the
 * invoice id): when it changes, the old data is dropped and loading restarts.
 *
 * Next keeps a page in memory after you leave it. `stale` is true when the
 * page is shown again and its data is still from the earlier visit.
 */
export function usePolling<T>(key: string, load: () => Promise<T>, intervalMs = REFRESH_MS) {
  const [state, setState] = useState<{ key: string; data?: T; failed: boolean; stale?: boolean }>({ key, failed: false });
  const latestLoad = useRef(load);
  const shown = useRef(false);
  useEffect(() => {
    latestLoad.current = load;
  });

  /** Load again right away, e.g. after a payment. Resolves when the new data is on screen. */
  const reload = useCallback(async () => {
    try {
      const data = await latestLoad.current();
      // A load that finishes after the page was hidden is old by the time the page is shown again.
      setState({ key, data, failed: false, stale: !shown.current });
    } catch {
      setState((old) => ({ ...(old.key === key ? old : { key }), failed: true }));
    }
  }, [key]);

  useEffect(() => {
    shown.current = true;
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      await reload();
      busy = false;
    };
    void tick();
    const timer = intervalMs > 0 ? setInterval(tick, intervalMs) : undefined;
    return () => {
      clearInterval(timer);
      shown.current = false;
      setState((old) => (old.data === undefined ? old : { ...old, stale: true }));
    };
  }, [reload, intervalMs]);

  const current = state.key === key ? state : undefined;
  return { data: current?.data, failed: current?.failed ?? false, stale: current?.stale ?? false, reload };
}
