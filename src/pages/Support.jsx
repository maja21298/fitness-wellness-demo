import { useState, useEffect, useCallback } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useTranslation } from "../i18n/useTranslation";
import MobilePageHeader from "../components/layout/MobilePageHeader";
import { useToast } from "../components/common/Toast";
import {
  HiChatBubbleLeftRight,
  HiPaperAirplane,
  HiChevronDown,
  HiChevronUp,
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiQuestionMarkCircle,
} from "react-icons/hi2";

const CATEGORIES = ["general", "bug", "feature", "account"];

const STATUS_STYLES = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

const STATUS_ICONS = {
  open: HiClock,
  in_progress: HiExclamationTriangle,
  resolved: HiCheckCircle,
  closed: HiCheckCircle,
};

export default function Support() {
  const { t, language } = useTranslation();
  const { addToast } = useToast();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [faqItems, setFaqItems] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const loadTickets = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setLoadingTickets(false); return; }
    try {
      const q = query(
        collection(db, "supportTickets"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load tickets:", err);
      addToast(
        language === "hr"
          ? "Nije moguce ucitati tvoje kartice podrske (provjerite vezu ili index u Firebase konzoli)."
          : "Could not load your support tickets. Check your connection or Firebase indexes.",
        "error",
      );
    } finally {
      setLoadingTickets(false);
    }
  }, [addToast, language]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "faq"));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        setFaqItems(items);
      } catch (error) {
        console.error("Load FAQ error:", error);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    setSending(true);
    try {
      await addDoc(collection(db, "supportTickets"), {
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || "",
        subject: subject.trim(),
        message: message.trim(),
        category,
        status: "open",
        priority: "medium",
        replies: [],
        createdAt: serverTimestamp(),
      });
      setSubject("");
      setMessage("");
      setCategory("general");
      addToast(t("support.sent"));
      loadTickets();
    } catch {
      addToast(t("support.sendFailed"), "error");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("hr-HR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="app-mobile-page p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      <MobilePageHeader title={t("support.title")} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
          <HiChatBubbleLeftRight className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="app-hide-on-mobile-header text-2xl font-bold text-gray-900">{t("support.title")}</h1>
          <p className="text-sm text-gray-400">{t("support.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.05fr] gap-5 items-start">
        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="bg-white rounded-[24px] border border-primary-100/60 p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("support.category")}</label>
                <p className="text-[11px] text-gray-400 mt-1">{t("support.subjectPlaceholder")}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    category === cat
                      ? "gradient-bg text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-primary-50"
                  }`}
                >
                  {t(`support.category${cat.charAt(0).toUpperCase() + cat.slice(1)}`)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 200))}
                placeholder={t("support.subjectPlaceholder")}
                maxLength={200}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none"
              />

              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
                placeholder={t("support.messagePlaceholder")}
                maxLength={5000}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-300 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !subject.trim() || !message.trim()}
              className="w-full py-3 gradient-bg text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {t("support.sending")}
                </>
              ) : (
                <>
                  <HiPaperAirplane className="w-4 h-4" />
                  {t("support.send")}
                </>
              )}
            </button>
          </form>

          {faqItems.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <HiQuestionMarkCircle className="w-4.5 h-4.5 text-primary-500" />
                {t("support.faqTitle")}
              </h2>
              <div className="space-y-2">
                {faqItems.map((faq) => {
                  const isOpen = expandedFaq === faq.id;
                  return (
                    <div key={faq.id} className="app-card overflow-hidden !p-0">
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                        className="w-full p-3.5 text-left flex items-center gap-3 hover:bg-primary-50/30 transition-colors"
                      >
                        <span className="w-6.5 h-6.5 rounded-full bg-primary-100 text-primary-600 text-[10px] font-bold flex items-center justify-center shrink-0">?</span>
                        <p className="flex-1 font-semibold text-gray-900 text-sm leading-snug">{faq.question}</p>
                        {isOpen ? <HiChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <HiChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-3.5 pb-3.5 pt-0 ml-9">
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">{t("support.myTickets")}</h2>

          {loadingTickets ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-primary-600 border-t-transparent mx-auto" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">{t("support.noTickets")}</p>
          ) : (
            tickets.map((ticket) => {
              const isExpanded = expandedTicket === ticket.id;
              const StatusIcon = STATUS_ICONS[ticket.status] || HiClock;
              const preview = (ticket.message || "").split("\n").find((line) => line.trim()) || ticket.message || "";
              return (
                <div key={ticket.id} className="app-card overflow-hidden !p-0">
                  <button
                    type="button"
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    className="w-full p-3.5 sm:p-4 text-left flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3 hover:bg-primary-50/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 w-full min-w-0">
                      <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${STATUS_STYLES[ticket.status]?.split(" ")[1] || "text-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm truncate">{ticket.subject}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[ticket.status]}`}>
                            {t(`support.${ticket.status === "in_progress" ? "inProgress" : ticket.status}`)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 sm:pl-8">{preview}</p>
                    <div className="self-end sm:self-auto sm:ml-auto">
                      {isExpanded ? <HiChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <HiChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 sm:px-4 pb-4 border-t border-primary-100/60 space-y-3 pt-3">
                      <details className="rounded-xl border border-primary-100/60 bg-primary-50/30 px-3 py-2.5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-primary-700 [&::-webkit-details-marker]:hidden">
                          <span>{t("support.you")}</span>
                          <span className="text-xs text-primary-500">{t("support.messagePlaceholder")}</span>
                        </summary>
                        <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                      </details>

                      <details className="rounded-xl border border-primary-100/60 bg-white px-3 py-2.5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-700 [&::-webkit-details-marker]:hidden">
                          <span>{t("support.replies")}</span>
                          <span className="text-xs text-gray-400">{ticket.replies?.length || 0}</span>
                        </summary>
                        <div className="mt-3 space-y-2">
                          {ticket.replies?.length > 0 ? (
                            ticket.replies.map((reply, idx) => (
                              <div
                                key={`${ticket.id}-reply-${idx}`}
                                className={`rounded-xl p-3 ${reply.fromAdmin ? "bg-emerald-50/60 border border-emerald-100" : "bg-primary-50/40"}`}
                              >
                                <p className={`text-xs font-semibold mb-1 ${reply.fromAdmin ? "text-emerald-600" : "text-primary-600"}`}>
                                  {reply.fromAdmin ? t("support.admin") : t("support.you")}
                                </p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                                <p className="text-[10px] text-gray-400 mt-2">{formatDate(reply.createdAt)}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-2">{t("support.noReplies")}</p>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
