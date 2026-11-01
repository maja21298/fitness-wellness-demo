import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./demo.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";

// Mobile Safari/Chrome often restore the tab from back-forward cache without reloading scripts,
// so users keep an old bundle until a hard refresh. Reload once when the page is restored from BF cache.
if (typeof window !== "undefined") {
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AccessibilityProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AccessibilityProvider>
  </StrictMode>
);
