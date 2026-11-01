import { useState, useCallback, createContext, useContext, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { HiCheckCircle, HiExclamationCircle, HiXMark } from "react-icons/hi2";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastSeq = useRef(0);
  const location = useLocation();
  const routePath = location.pathname;

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = ++toastSeq.current;
    const path = window.location.pathname;
    setToasts((prev) => [...prev, { id, message, type, path }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Only show toasts created on the current route (prevents Nutrition errors lingering on Workout).
  const visibleToasts = useMemo(
    () => toasts.filter((t) => t.path === routePath),
    [toasts, routePath],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {visibleToasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in backdrop-blur-sm ${
              t.type === "success"
                ? "bg-emerald-500/90 text-white"
                : t.type === "error"
                  ? "bg-red-500/90 text-white"
                  : "bg-gold-500/90 text-white"
            }`}
          >
            {t.type === "success" ? (
              <HiCheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <HiExclamationCircle className="w-5 h-5 shrink-0" />
            )}
            {t.message}
            <button onClick={() => removeToast(t.id)} className="ml-2 shrink-0">
              <HiXMark className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
