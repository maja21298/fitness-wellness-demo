import { useCallback } from "react";
import { translations } from "./translations";

export function useTranslation() {
  const language = "en";

  const t = useCallback(
    (path, fallback) => {
      const keys = path.split(".");
      let val = translations.en;
      for (const k of keys) {
        val = val?.[k];
        if (val == null) break;
      }
      if (val != null) return val;

      let enVal = translations.en;
      for (const k of keys) {
        enVal = enVal?.[k];
        if (enVal == null) break;
      }
      return enVal ?? fallback ?? path;
    },
    [language],
  );

  return { t, language };
}
