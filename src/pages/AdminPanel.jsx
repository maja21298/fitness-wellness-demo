import { useState, useEffect, useCallback } from "react";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { useToast } from "../components/common/Toast";
import { useNavigate } from "react-router-dom";
import {
  callListUsers,
  callEnsureAdminDoc,
  callBlockUser,
  callDeleteUser,
} from "../services/geminiService";
import {
  HiShieldCheck,
  HiMagnifyingGlass,
  HiSparkles,
  HiXMark,
  HiUserGroup,
  HiArrowPath,
  HiChatBubbleLeftRight,
  HiNoSymbol,
  HiTrash,
  HiCheckCircle,
  HiClock,
  HiExclamationTriangle,
  HiPencilSquare,
  HiPlus,
  HiChevronDown,
  HiChevronUp,
  HiDocumentText,
  HiLockClosed,
  HiLockOpen,
  HiPaperAirplane,
  HiFunnel,
  HiQuestionMarkCircle,
} from "react-icons/hi2";

const TABS = ["users", "tickets", "templates", "faq"];
const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

const STATUS_STYLE = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

const PRIORITY_STYLE = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const DEFAULT_TEMPLATES = [
  { title: "Pozdrav", message: "Pozdrav! Hvala sto ste nas kontaktirali. Pregledali smo vas upit i rado cemo vam pomoci.", category: "greeting" },
  { title: "Primili smo upit", message: "Hvala na vasem upitu. Nas tim ga je primio i odgovorit cemo vam u najkracem mogucem roku.", category: "greeting" },
  { title: "Bug prijavljen", message: "Hvala sto ste prijavili ovaj problem. Nas razvojni tim je obavijesten i radimo na ispravku. Javit cemo vam kada bude rijeseno.", category: "bug_response" },
  { title: "Prijedlog primljen", message: "Hvala na vasem prijedlogu! Cijenimo povratne informacije nasih korisnika. Proslijedili smo vas prijedlog razvojnom timu na razmatranje.", category: "feature_request" },
  { title: "Problem s racunom", message: "Razumijemo da imate problem s racunom. Molimo vas da nam posaljete email adresu povezanu s vasim racunom kako bismo mogli pomoci.", category: "account_issue" },
  { title: "Premium aktiviran", message: "Vas premium pristup je aktiviran! Sada imate pristup svim naprednim znacajkama aplikacije. Uzivajte!", category: "general" },
  { title: "Zatvoren upit", message: "Vas upit je rijesen. Ako imate dodatnih pitanja, slobodno nas kontaktirajte ponovo. Hvala na strpljenju!", category: "closing" },
  { title: "Opca zahvala", message: "Hvala vam na koristenju nase aplikacije! Ako trebate bilo kakvu dodatnu pomoc, tu smo za vas.", category: "general" },
];

const DEFAULT_FAQ = [
  { question: "Kako mogu promijeniti svoj plan treninga?", answer: "Idi na stranicu 'Trening' i tamo mozes prilagoditi svoj plan prema svojim ciljevima i razini iskustva.", order: 1 },
  { question: "Kako funkcionira premium pristup?", answer: "Premium pristup otključava napredne znacajke kao sto su AI analiza hrane, detaljni planovi prehrane i napredna analiza tijela. Mozes ga aktivirati na stranici 'Premium'.", order: 2 },
  { question: "Mogu li koristiti aplikaciju bez opreme?", answer: "Da! Aplikacija nudi opciju treninga kod kuce bez ikakve opreme. Odaberi 'Trening kod kuce' prilikom postavljanja plana.", order: 3 },
  { question: "Kako promijenim prehrambene postavke?", answer: "Idi u 'Postavke' i tamo mozes odabrati prehrambene preferencije (vegetarijanstvo, veganstvo, bezglutensko itd.). Plan prehrane ce se automatski prilagoditi.", order: 4 },
  { question: "Sto je AI skener hrane?", answer: "AI skener hrane koristi kameru ili rucni unos sastojaka da prepozna namirnice i predlozi zdrave recepte prilagodene tvojim ciljevima.", order: 5 },
  { question: "Kako mogu pratiti svoj napredak?", answer: "Na stranici 'Napredak' mozes unositi svoju tezinu, pratiti grafove i vidjeti kako se tvoje tijelo mijenja kroz vrijeme.", order: 6 },
  { question: "Mogu li kontaktirati podrsku?", answer: "Da! Klikni na 'Podrska' u izborniku i posalji nam poruku. Odgovorit cemo ti u najkracem mogucem roku.", order: 7 },
  { question: "Kako funkcionira analiza tijela?", answer: "Analiza tijela koristi tvoje podatke (visina, tezina, dob, spol) za izracun BMI-a, postotka masnog tkiva i preporucene tezine. Mozes i odabrati zeljenu gradu tijela.", order: 8 },
];

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("hr-HR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Users Tab ────────────────────────────────────────────────────────
function UsersTab({ t, addToast }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showBlocked, setShowBlocked] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callListUsers(search);
      setUsers(data.users || []);
    } catch {
      addToast(t("admin.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [search, addToast, t]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleToggle = async (uid, currentTier) => {
    const newTier = currentTier === "free" ? "admin_grant" : "free";
    setUpdating(uid);
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          subscription: {
            tier: newTier,
            grantedBy: newTier === "admin_grant" ? auth.currentUser.uid : null,
            updatedAt: serverTimestamp(),
            validUntil: null,
          },
          lastUpdated: serverTimestamp(),
        },
        { merge: true },
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid ? { ...u, subscription: { ...u.subscription, tier: newTier } } : u,
        ),
      );
      addToast(newTier === "admin_grant" ? t("admin.granted") : t("admin.revoked"));
    } catch (err) {
      const detail = err?.message || err?.code || "";
      if (detail.includes("permission")) addToast(t("admin.needAdminDoc"), "error");
      else addToast(`${t("admin.updateFailed")}: ${detail}`, "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleBlock = async (uid, shouldBlock) => {
    setUpdating(uid);
    try {
      await callBlockUser(uid, shouldBlock);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid ? { ...u, blocked: shouldBlock, blockedAt: shouldBlock ? new Date().toISOString() : null } : u,
        ),
      );
      addToast(shouldBlock ? t("admin.blockSuccess") : t("admin.unblockSuccess"));
    } catch {
      addToast(t("admin.blockFailed"), "error");
    } finally {
      setUpdating(uid);
      setConfirmBlock(null);
      setUpdating(null);
    }
  };

  const handleDelete = async (uid) => {
    setUpdating(uid);
    try {
      await callDeleteUser(uid);
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      addToast(t("admin.deleteSuccess"));
    } catch {
      addToast(t("admin.deleteFailed"), "error");
    } finally {
      setConfirmDelete(null);
      setDeleteInput("");
      setUpdating(null);
    }
  };

  const tierBadge = (tier) => {
    const styles = { free: "bg-gray-100 text-gray-600", premium: "bg-amber-100 text-amber-700", admin_grant: "bg-emerald-100 text-emerald-700" };
    const labels = { free: t("admin.tierFree"), premium: t("admin.tierPremium"), admin_grant: t("admin.tierGranted") };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[tier] || styles.free}`}>
        {labels[tier] || tier}
      </span>
    );
  };

  const filteredUsers = showBlocked ? users.filter((u) => u.blocked) : users;
  const premiumCount = users.filter((u) => u.subscription?.tier === "premium" || u.subscription?.tier === "admin_grant").length;
  const blockedCount = users.filter((u) => u.blocked).length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-2xl border border-primary-100/60 p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500">{t("admin.totalUsers")}</p>
        </div>
        <div className="bg-white rounded-2xl border border-primary-100/60 p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{premiumCount}</p>
          <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500">{t("admin.premiumUsers")}</p>
        </div>
        <div className="bg-white rounded-2xl border border-primary-100/60 p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-red-600">{blockedCount}</p>
          <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500">{t("admin.blockedUsers")}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
            onKeyDown={(e) => e.key === "Enter" && loadUsers()}
          />
        </div>
        <button
          onClick={() => setShowBlocked(!showBlocked)}
          className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-1.5 ${
            showBlocked ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <HiFunnel className="w-4 h-4" />
          {t("admin.showOnlyBlocked")}
        </button>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="px-4 py-2.5 gradient-bg text-white rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          <HiArrowPath className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <HiUserGroup className="w-4 h-4" />
        <span>{filteredUsers.length} {t("admin.usersFound")}</span>
      </div>

      {/* Users List */}
      {loading && users.length === 0 ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-12 text-center text-gray-400"><p>{t("admin.noUsers")}</p></div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u) => {
            const isExpanded = expanded === u.uid;
            const tier = u.subscription?.tier || "free";
            return (
              <div key={u.uid} className="bg-white rounded-2xl border border-primary-100/60 overflow-hidden shadow-sm">
                {/* Row Header */}
                <div className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    u.blocked ? "bg-red-100 text-red-600" : "bg-primary-100 text-primary-600"
                  }`}>
                    {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm truncate">{u.displayName || t("admin.noName")}</p>
                      {tierBadge(tier)}
                      {u.blocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-red-100 text-red-600">
                          {t("admin.blocked")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email || u.uid}</p>
                  </div>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : u.uid)}
                    className="self-start p-2 rounded-lg hover:bg-primary-50 text-gray-400 transition-colors"
                  >
                    {isExpanded ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-primary-100/60 p-3 sm:p-4 space-y-3 bg-primary-50/20">
                    <details className="rounded-2xl border border-primary-100/60 bg-white px-3 py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-primary-700 [&::-webkit-details-marker]:hidden">
                        <span>{t("admin.details")}</span>
                        <span className="text-[11px] font-medium text-gray-500">
                          {t("admin.createdAt")} · {t("admin.subscription")}
                        </span>
                      </summary>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{t("admin.createdAt")}</p>
                          <p className="text-gray-700">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("hr-HR") : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{t("admin.lastSignIn")}</p>
                          <p className="text-gray-700">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString("hr-HR") : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{t("admin.subscription")}</p>
                          <p className="text-gray-700">{tierBadge(tier)}</p>
                        </div>
                      </div>
                    </details>

                    <details className="rounded-2xl border border-primary-100/60 bg-white px-3 py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-primary-700 [&::-webkit-details-marker]:hidden">
                        <span>{t("admin.actions")}</span>
                        <span className="text-[11px] font-medium text-gray-500">
                          {t("admin.grant")} · {t("admin.block")} · {t("admin.deleteUser")}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleToggle(u.uid, tier)}
                            disabled={updating === u.uid}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 ${
                              tier === "admin_grant" || tier === "premium"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {tier === "admin_grant" || tier === "premium" ? (
                              <><HiXMark className="w-3 h-3" /> {t("admin.revoke")}</>
                            ) : (
                              <><HiSparkles className="w-3 h-3" /> {t("admin.grant")}</>
                            )}
                          </button>

                          <button
                            onClick={() => setConfirmBlock(confirmBlock === u.uid ? null : u.uid)}
                            disabled={updating === u.uid}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 ${
                              u.blocked
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                            }`}
                          >
                            {u.blocked ? (
                              <><HiLockOpen className="w-3 h-3" /> {t("admin.unblock")}</>
                            ) : (
                              <><HiLockClosed className="w-3 h-3" /> {t("admin.block")}</>
                            )}
                          </button>

                          <button
                            onClick={() => { setConfirmDelete(confirmDelete === u.uid ? null : u.uid); setDeleteInput(""); }}
                            disabled={updating === u.uid}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <HiTrash className="w-3 h-3" /> {t("admin.deleteUser")}
                          </button>
                        </div>

                        {confirmBlock === u.uid && (
                          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-2">
                            <p className="text-sm text-amber-800">{t("admin.blockConfirm")}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleBlock(u.uid, !u.blocked)}
                                disabled={updating === u.uid}
                                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                              >
                                {updating === u.uid ? "..." : t("admin.confirm")}
                              </button>
                              <button onClick={() => setConfirmBlock(null)} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white text-gray-600 border border-gray-200">
                                {t("admin.cancel")}
                              </button>
                            </div>
                          </div>
                        )}

                        {confirmDelete === u.uid && (
                          <div className="bg-red-50 rounded-xl p-3 border border-red-200 space-y-2">
                            <p className="text-sm text-red-800">{t("admin.deleteConfirm")}</p>
                            <input
                              type="text"
                              value={deleteInput}
                              onChange={(e) => setDeleteInput(e.target.value)}
                              placeholder="DELETE"
                              className="w-full px-3 py-2 text-sm rounded-lg border border-red-300 focus:ring-2 focus:ring-red-300 outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(u.uid)}
                                disabled={deleteInput !== "DELETE" || updating === u.uid}
                                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {updating === u.uid ? "..." : t("admin.confirm")}
                              </button>
                              <button onClick={() => { setConfirmDelete(null); setDeleteInput(""); }} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white text-gray-600 border border-gray-200">
                                {t("admin.cancel")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Support Tickets Tab ──────────────────────────────────────────────
function TicketsTab({ t, addToast, templates }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "supportTickets"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Load tickets error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const replyObj = {
        message: replyText.trim(),
        fromAdmin: true,
        createdAt: new Date().toISOString(),
        adminUid: auth.currentUser?.uid,
      };
      await updateDoc(doc(db, "supportTickets", ticketId), {
        replies: arrayUnion(replyObj),
        status: "in_progress",
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, replies: [...(t.replies || []), replyObj], status: "in_progress" }
            : t,
        ),
      );
      setReplyText("");
      addToast(t("admin.replySent"));
    } catch {
      addToast(t("admin.replyFailed"), "error");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), { status: newStatus });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
      addToast(t("admin.statusChanged"));
    } catch {
      addToast(t("admin.replyFailed"), "error");
    }
  };

  const filtered = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-5">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: t("admin.allTickets"), count: tickets.length },
          { key: "open", label: t("admin.statusOpen"), count: openCount },
          { key: "in_progress", label: t("admin.statusInProgress"), count: tickets.filter((t) => t.status === "in_progress").length },
          { key: "resolved", label: t("admin.statusResolved"), count: tickets.filter((t) => t.status === "resolved").length },
          { key: "closed", label: t("admin.statusClosed"), count: tickets.filter((t) => t.status === "closed").length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === f.key
                ? "gradient-bg text-white border-transparent"
                : "bg-white text-gray-600 border-gray-200 hover:bg-primary-50"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <HiChatBubbleLeftRight className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>{t("admin.noTickets")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => {
            const isExpanded = expanded === ticket.id;
            return (
              <div key={ticket.id} className="bg-white rounded-2xl border border-primary-100/60 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => { setExpanded(isExpanded ? null : ticket.id); setReplyText(""); }}
                  className="w-full p-3 sm:p-4 text-left flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3 hover:bg-primary-50/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    ticket.priority === "high" ? "bg-red-100 text-red-600" : "bg-primary-100 text-primary-600"
                  }`}>
                    {(ticket.userName || ticket.userEmail || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm truncate">{ticket.subject}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLE[ticket.status]}`}>
                        {t(`admin.status${ticket.status === "in_progress" ? "InProgress" : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}`)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ticket.userName || ticket.userEmail} · {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  {isExpanded ? <HiChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <HiChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-primary-100/60 p-3 sm:p-4 space-y-3 bg-primary-50/10">
                    <div className="bg-primary-50/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-primary-600">{t("admin.userReply")}: {ticket.userName || ticket.userEmail}</span>
                        {ticket.category && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-600">
                            {t(`admin.category${ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}`)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    <details className="rounded-2xl border border-primary-100/60 bg-white px-3 py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-primary-700 [&::-webkit-details-marker]:hidden">
                        <span>{t("admin.details")}</span>
                        <span className="text-[11px] font-medium text-gray-500">
                          {ticket.replies?.length || 0} {ticket.replies?.length === 1 ? "reply" : "replies"}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-3">
                        {ticket.replies?.map((reply, idx) => (
                          <div
                            key={`reply-${idx}`}
                            className={`rounded-xl p-3 ${reply.fromAdmin ? "bg-emerald-50/60 border border-emerald-100 ml-4" : "bg-primary-50/50"}`}
                          >
                            <p className={`text-xs font-semibold mb-1 ${reply.fromAdmin ? "text-emerald-600" : "text-primary-600"}`}>
                              {reply.fromAdmin ? t("admin.adminReply") : t("admin.userReply")}
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1.5">{formatDate(reply.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    <details className="rounded-2xl border border-primary-100/60 bg-white px-3 py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-primary-700 [&::-webkit-details-marker]:hidden">
                        <span>{t("admin.actions")}</span>
                        <span className="text-[11px] font-medium text-gray-500">{t("admin.changeStatus")} · {t("admin.sendReply")}</span>
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500 font-medium">{t("admin.changeStatus")}:</span>
                          {TICKET_STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(ticket.id, s)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase transition-colors ${
                                ticket.status === s
                                  ? STATUS_STYLE[s]
                                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                              }`}
                            >
                              {t(`admin.status${s === "in_progress" ? "InProgress" : s.charAt(0).toUpperCase() + s.slice(1)}`)}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          {templates.length > 0 && (
                            <select
                              className="w-full sm:w-auto text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 outline-none focus:ring-2 focus:ring-primary-300"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) setReplyText(e.target.value);
                              }}
                            >
                              <option value="">{t("admin.useTemplate")}...</option>
                              {templates.map((tpl) => (
                                <option key={tpl.id} value={tpl.message}>{tpl.title}</option>
                              ))}
                            </select>
                          )}
                          <textarea
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t("admin.replyPlaceholder")}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none resize-none"
                          />
                          <button
                            onClick={() => handleReply(ticket.id)}
                            disabled={sending || !replyText.trim()}
                            className="px-4 py-2 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {sending ? (
                              <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <HiPaperAirplane className="w-3.5 h-3.5" />
                            )}
                            {t("admin.sendReply")}
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Templates Tab ────────────────────────────────────────────────────
function TemplatesTab({ t, addToast, templates, setTemplates }) {
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const handleAdd = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "replyTemplates"), {
        title: newTitle.trim(),
        message: newMessage.trim(),
        category: "general",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
      });
      setTemplates((prev) => [
        ...prev,
        { id: docRef.id, title: newTitle.trim(), message: newMessage.trim(), category: "general" },
      ]);
      setNewTitle("");
      setNewMessage("");
      addToast(t("admin.templateSaved"));
    } catch {
      addToast(t("admin.templateFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    if (!editTitle.trim() || !editMessage.trim()) return;
    try {
      await updateDoc(doc(db, "replyTemplates", id), {
        title: editTitle.trim(),
        message: editMessage.trim(),
      });
      setTemplates((prev) =>
        prev.map((tpl) => (tpl.id === id ? { ...tpl, title: editTitle.trim(), message: editMessage.trim() } : tpl)),
      );
      setEditing(null);
      addToast(t("admin.templateSaved"));
    } catch {
      addToast(t("admin.templateFailed"), "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "replyTemplates", id));
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      addToast(t("admin.templateDeleted"));
    } catch {
      addToast(t("admin.templateFailed"), "error");
    }
  };

  return (
    <div className="space-y-5">
      {/* Add New Template */}
      <div className="bg-white rounded-2xl border border-primary-100/60 p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <HiPlus className="w-4 h-4 text-primary-600" />
          {t("admin.addTemplate")}
        </h3>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t("admin.templateTitle")}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
        />
        <textarea
          rows={3}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t("admin.templateMessage")}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newTitle.trim() || !newMessage.trim()}
          className="px-4 py-2 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" /> : <HiPlus className="w-3.5 h-3.5" />}
          {t("admin.addTemplate")}
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <HiDocumentText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>{t("admin.noTemplates")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-2xl border border-primary-100/60 p-4 shadow-sm">
              {editing === tpl.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
                  />
                  <textarea
                    rows={3}
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(tpl.id)}
                      className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    >
                      {t("admin.saveTemplate")}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
                    >
                      {t("admin.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{tpl.title}</p>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{tpl.message}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setEditing(tpl.id); setEditTitle(tpl.title); setEditMessage(tpl.message); }}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <HiPencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FAQ Tab ──────────────────────────────────────────────────────────
function FaqTab({ t, addToast, faqItems, setFaqItems }) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setSaving(true);
    try {
      const nextOrder = faqItems.length > 0 ? Math.max(...faqItems.map((f) => f.order || 0)) + 1 : 1;
      const docRef = await addDoc(collection(db, "faq"), {
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
        order: nextOrder,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
      });
      setFaqItems((prev) => [...prev, { id: docRef.id, question: newQuestion.trim(), answer: newAnswer.trim(), order: nextOrder }]);
      setNewQuestion("");
      setNewAnswer("");
      addToast(t("admin.faqSaved"));
    } catch {
      addToast(t("admin.faqFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    try {
      await updateDoc(doc(db, "faq", id), { question: editQuestion.trim(), answer: editAnswer.trim() });
      setFaqItems((prev) => prev.map((f) => (f.id === id ? { ...f, question: editQuestion.trim(), answer: editAnswer.trim() } : f)));
      setEditing(null);
      addToast(t("admin.faqSaved"));
    } catch {
      addToast(t("admin.faqFailed"), "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "faq", id));
      setFaqItems((prev) => prev.filter((f) => f.id !== id));
      addToast(t("admin.faqDeleted"));
    } catch {
      addToast(t("admin.faqFailed"), "error");
    }
  };

  const sorted = [...faqItems].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-primary-100/60 p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <HiPlus className="w-4 h-4 text-primary-600" />
          {t("admin.addFaq")}
        </h3>
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder={t("admin.faqQuestionPlaceholder")}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
        />
        <textarea
          rows={3}
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          placeholder={t("admin.faqAnswerPlaceholder")}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newQuestion.trim() || !newAnswer.trim()}
          className="px-4 py-2 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" /> : <HiPlus className="w-3.5 h-3.5" />}
          {t("admin.addFaq")}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <HiQuestionMarkCircle className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>{t("admin.noFaq")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((faq, idx) => (
            <div key={faq.id} className="bg-white rounded-2xl border border-primary-100/60 p-4 shadow-sm">
              {editing === faq.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none font-semibold"
                  />
                  <textarea
                    rows={3}
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(faq.id)} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                      {t("admin.saveTemplate")}
                    </button>
                    <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100">
                      {t("admin.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                        <p className="font-semibold text-gray-900 text-sm">{faq.question}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 ml-8 whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setEditing(faq.id); setEditQuestion(faq.question); setEditAnswer(faq.answer); }}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <HiPencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Panel ─────────────────────────────────────────────────
export default function AdminPanel() {
  const { isAdmin, user } = useAuth();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("users");
  const [adminDocOk, setAdminDocOk] = useState(null);
  const [creatingAdminDoc, setCreatingAdminDoc] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [faqItems, setFaqItems] = useState([]);
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    if (!isAdmin || !user?.uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "admins", user.uid));
        setAdminDocOk(snap.exists());
      } catch {
        setAdminDocOk(false);
      }
    })();
  }, [isAdmin, user?.uid]);

  // Load templates and seed defaults
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "replyTemplates"));
        if (snap.empty) {
          const batch = [];
          for (const tpl of DEFAULT_TEMPLATES) {
            const ref = await addDoc(collection(db, "replyTemplates"), {
              ...tpl,
              createdAt: serverTimestamp(),
              createdBy: "system",
            });
            batch.push({ id: ref.id, ...tpl });
          }
          setTemplates(batch);
          addToast(t("admin.defaultTemplatesCreated"));
        } else {
          setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Load templates error:", err);
      }
    })();
  }, [isAdmin, addToast, t]);

  // Load FAQ items and seed defaults
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "faq"));
        if (snap.empty) {
          const batch = [];
          for (const item of DEFAULT_FAQ) {
            const ref = await addDoc(collection(db, "faq"), {
              ...item,
              createdAt: serverTimestamp(),
              createdBy: "system",
            });
            batch.push({ id: ref.id, ...item });
          }
          setFaqItems(batch);
        } else {
          setFaqItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Load FAQ error:", err);
      }
    })();
  }, [isAdmin]);

  // Load open ticket count for badge
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "supportTickets"));
        setTicketCount(snap.docs.filter((d) => d.data().status === "open").length);
      } catch (error) {
        console.error("Load support ticket count error:", error);
      }
    })();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-20">
        <HiShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900">{t("admin.noAccess")}</h1>
        <p className="text-gray-400 mt-2">{t("admin.noAccessDesc")}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 px-6 py-2 gradient-bg text-white font-medium rounded-xl"
        >
          {t("common.back")}
        </button>
      </div>
    );
  }

  const tabConfig = [
    { key: "users", label: t("admin.tabUsers"), icon: HiUserGroup },
    { key: "tickets", label: t("admin.tabTickets"), icon: HiChatBubbleLeftRight, badge: ticketCount },
    { key: "templates", label: t("admin.tabTemplates"), icon: HiDocumentText },
    { key: "faq", label: t("admin.tabFaq"), icon: HiQuestionMarkCircle },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
          <HiShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.title")}</h1>
          <p className="text-sm text-gray-400">{t("admin.subtitle")}</p>
        </div>
      </div>

      {/* Admin Doc Warning */}
      {adminDocOk === false && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-3">
          <div>
            <p className="font-semibold mb-1">{t("admin.adminDocTitle")}</p>
            <p className="text-amber-800/90">{t("admin.adminDocBody")}</p>
            <p className="mt-2 font-mono text-xs break-all bg-white/60 rounded-lg px-2 py-1">
              admins/{user?.uid}
            </p>
          </div>
          <button
            type="button"
            disabled={creatingAdminDoc}
            onClick={async () => {
              setCreatingAdminDoc(true);
              try {
                await callEnsureAdminDoc();
                const snap = await getDoc(doc(db, "admins", user.uid));
                setAdminDocOk(snap.exists());
                addToast(t("admin.adminDocCreated"), "success");
              } catch (err) {
                const msg = err?.message || err?.code || "";
                addToast(msg ? `${t("admin.adminDocCreateFailed")}: ${msg}` : t("admin.adminDocCreateFailed"), "error");
              } finally {
                setCreatingAdminDoc(false);
              }
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-700 text-white text-sm font-medium hover:bg-amber-800 disabled:opacity-50"
          >
            {creatingAdminDoc ? t("admin.creatingAdminDoc") : t("admin.createAdminDocBtn")}
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-primary-50/50 rounded-2xl p-1">
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "users" && <UsersTab t={t} addToast={addToast} />}
      {activeTab === "tickets" && <TicketsTab t={t} addToast={addToast} templates={templates} />}
      {activeTab === "templates" && <TemplatesTab t={t} addToast={addToast} templates={templates} setTemplates={setTemplates} />}
      {activeTab === "faq" && <FaqTab t={t} addToast={addToast} faqItems={faqItems} setFaqItems={setFaqItems} />}
    </div>
  );
}
