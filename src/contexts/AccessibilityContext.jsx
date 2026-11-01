import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AccessibilityContext = createContext(null);

const DEFAULTS = { mode: "normal", fontSize: "medium", language: "en", theme: "pink" };

export const THEMES = [
  { id: "default", label: "Holographic", desc: "Purple, pink & gold" },
  { id: "pink", label: "Rose Pink", desc: "Warm pink & white" },
  { id: "dark", label: "Dark Steel", desc: "Dark, blue & green" },
  { id: "minimal", label: "Minimal", desc: "Clean black & white" },
];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hr", label: "Hrvatski" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Espanol" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Francais" },
  { code: "pt", label: "Portugues" },
];

function load() {
  try {
    const raw = localStorage.getItem("a11y");
    return raw ? { ...DEFAULTS, ...JSON.parse(raw), language: "en" } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function persist(prefs) {
  try {
    localStorage.setItem("a11y", JSON.stringify(prefs));
  } catch {
    // Ignore storage write failures in private mode / restricted browsers.
  }
}

function applyToDOM(prefs) {
  const root = document.documentElement;
  root.lang=prefs.language || "en";
  root.classList.remove("a11y-hc", "a11y-dyslexia", "font-sm", "font-md", "font-lg", "theme-default", "theme-dark", "theme-minimal");
  if (prefs.mode === "highContrast") root.classList.add("a11y-hc");
  if (prefs.mode === "dyslexia") root.classList.add("a11y-dyslexia");
  root.classList.add(`font-${prefs.fontSize === "small" ? "sm" : prefs.fontSize === "large" ? "lg" : "md"}`);
  root.classList.add(`theme-${prefs.theme || "default"}`);
}

export function AccessibilityProvider({ children }) {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    applyToDOM(prefs);
    persist(prefs);
  }, [prefs]);

  const setMode = useCallback((mode) => setPrefs((p) => ({ ...p, mode })), []);
  const setFontSize = useCallback((fontSize) => setPrefs((p) => ({ ...p, fontSize })), []);
  // Public portfolio preview is English-only. Ignore any older saved HR preference.
  const setLanguage = useCallback(() => setPrefs((p) => ({ ...p, language: "en" })), []);
  const setTheme = useCallback((theme) => setPrefs((p) => ({ ...p, theme })), []);
  const resetAll = useCallback(() => setPrefs(DEFAULTS), []);

  return (
    <AccessibilityContext.Provider value={{ ...prefs, setMode, setFontSize, setLanguage, setTheme, resetAll }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useA11y() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useA11y must be used within AccessibilityProvider");
  return ctx;
}
