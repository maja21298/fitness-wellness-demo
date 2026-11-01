import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { callEnsureAdminDoc } from "../../services/geminiService";

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading, recheckAdmin } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootstrapDone, setBootstrapDone] = useState(false);

  useEffect(() => {
    if (loading || !user || isAdmin || bootstrapDone) return;

    let cancelled = false;
    setBootstrapping(true);

    (async () => {
      try {
        await callEnsureAdminDoc();
        if (!cancelled) await recheckAdmin();
      } catch {
        /* server rejected — not admin */
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
          setBootstrapDone(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [loading, user, isAdmin, bootstrapDone, recheckAdmin]);

  if (loading || bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-400 border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
