"use client";

import { useSyncExternalStore } from "react";
import { translateMessage } from "./translate";

// Spanish is the app's language (the shops are in El Salvador). English is for judges
// and partners: the switch in the top banner flips every screen at once.

export type Lang = "es" | "en";

const KEY = "relay-lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "es") return fromUrl;
    return window.localStorage.getItem(KEY) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

let current: Lang | null = null;

function snapshot(): Lang {
  if (current === null) {
    current = read();
    document.documentElement.lang = current;
  }
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLang(lang: Lang) {
  current = lang;
  document.documentElement.lang = lang;
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    // private mode: the choice lasts until the page reloads
  }
  // A ?lang= in the address would win over the switch on the next load, so drop it.
  const url = new URL(window.location.href);
  if (url.searchParams.has("lang")) {
    url.searchParams.delete("lang");
    window.history.replaceState(window.history.state, "", url);
  }
  listeners.forEach((listener) => listener());
}

/** The language on screen. The server and the first render use Spanish, then the saved choice. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, snapshot, () => "es");
}

/**
 * `t("Pagar ahora", "Pay now")`: both languages side by side, so a screen reads in either one.
 * `msg(text)` translates a message that came from the server or the contract (always Spanish).
 */
export function useT() {
  const lang = useLang();
  const t = (es: string, en: string) => (lang === "en" ? en : es);
  const msg = (text: string) => (lang === "en" ? translateMessage(text) : text);
  return { lang, t, msg };
}
