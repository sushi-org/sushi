"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/toast";
import { useBranch } from "@/contexts/branch-context";

interface Contact {
  id: string;
  phone: string;
  name: string | null;
}

interface ConversationListItem {
  id: string;
  branch_id: string;
  channel: string;
  contact: Contact;
  status: "active" | "escalated" | "resolved";
  escalated_at: string | null;
  message_count: number;
  created_at: string;
}

interface Message {
  id: string;
  role: "customer" | "agent" | "member";
  content: string;
  created_at: string;
}

interface ConversationDetail {
  id: string;
  branch_id: string;
  channel: string;
  contact: Contact;
  status: "active" | "escalated" | "resolved";
  escalated_at: string | null;
  resolved_at: string | null;
  messages: Message[];
  created_at: string;
}

type StatusFilter = "all" | "active" | "escalated" | "resolved" | "needed_human";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function contactLabel(contact: Contact): string {
  return contact.name || contact.phone;
}

function neededHuman(conv: ConversationListItem): boolean {
  return (
    conv.status === "escalated" ||
    (conv.status === "resolved" && conv.escalated_at != null)
  );
}

function InboxContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { selectedBranchId, setSelectedBranchId, branches } = useBranch();
  const companyId = session?.companyId;

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    searchParams.get("needed_human") === "true" ? "needed_human" : "all"
  );

  // Sync from URL when it changes (e.g. client-side navigation)
  useEffect(() => {
    const needHuman = searchParams.get("needed_human") === "true";
    const branchFromUrl = searchParams.get("branch_id");
    if (needHuman) setStatusFilter("needed_human");
    if (branchFromUrl) setSelectedBranchId(branchFromUrl);
  }, [searchParams, setSelectedBranchId]);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showAddKB, setShowAddKB] = useState(false);
  const [kbQuestion, setKbQuestion] = useState("");
  const [kbAnswer, setKbAnswer] = useState("");
  const [kbCategory, setKbCategory] = useState("From escalation");
  const [kbSaving, setKbSaving] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!companyId) return;
    try {
      let path = `/companies/${companyId}/conversations`;
      const params = new URLSearchParams();
      if (selectedBranchId) params.set("branch_id", selectedBranchId);
      if (statusFilter === "needed_human") {
        params.set("needed_human", "true");
      } else if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const qs = params.toString();
      if (qs) path += `?${qs}`;

      const data = await api<ConversationListItem[]>(path);
      setConversations(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedBranchId, statusFilter]);

  useEffect(() => {
    setLoading(true);
    loadConversations();
  }, [loadConversations]);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const loadDetail = useCallback(
    async (convId: string) => {
      if (!companyId) return;
      setDetailLoading(true);
      try {
        const data = await api<ConversationDetail>(
          `/companies/${companyId}/conversations/${convId}`
        );
        setDetail(data);
      } catch {
        toast("Failed to load conversation", "error");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  // Poll detail when a conversation is selected
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => loadDetail(selectedId), 10000);
    return () => clearInterval(interval);
  }, [selectedId, loadDetail]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages.length]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!companyId || !selectedId || !replyText.trim()) return;
    setSending(true);
    try {
      await api(`/companies/${companyId}/conversations/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: replyText.trim() }),
      });
      setReplyText("");
      await loadDetail(selectedId);
      await loadConversations();
    } catch {
      toast("Failed to send reply", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleResolve() {
    if (!companyId || !selectedId) return;
    setActing(true);
    try {
      await api(`/companies/${companyId}/conversations/${selectedId}/resolve`, {
        method: "PUT",
      });
      toast("Conversation resolved");
      await loadDetail(selectedId);
      await loadConversations();
    } catch {
      toast("Failed to resolve", "error");
    } finally {
      setActing(false);
    }
  }

  async function handleHandBack() {
    if (!companyId || !selectedId) return;
    setActing(true);
    try {
      await api(
        `/companies/${companyId}/conversations/${selectedId}/hand-back`,
        { method: "PUT" }
      );
      toast("Handed back to AI");
      await loadDetail(selectedId);
      await loadConversations();
    } catch {
      toast("Failed to hand back", "error");
    } finally {
      setActing(false);
    }
  }

  function suggestQuestionFromConversation() {
    if (!detail?.messages?.length) return;
    const lastCustomer = [...detail.messages]
      .reverse()
      .find((m) => m.role === "customer");
    if (lastCustomer) {
      const truncated =
        lastCustomer.content.length > 120
          ? lastCustomer.content.slice(0, 120) + "..."
          : lastCustomer.content;
      setKbQuestion(truncated);
    }
  }

  async function handleAddToKnowledgeBase(e: FormEvent) {
    e.preventDefault();
    if (!companyId || !detail || !kbQuestion.trim() || !kbAnswer.trim()) return;
    setKbSaving(true);
    try {
      try {
        await api(
          `/companies/${companyId}/branches/${detail.branch_id}/agent`,
          { method: "PUT", body: JSON.stringify({ name: "AI Receptionist" }) }
        );
      } catch {
        /* Agent may already exist */
      }
      await api(
        `/companies/${companyId}/branches/${detail.branch_id}/agent/knowledge`,
        {
          method: "POST",
          body: JSON.stringify({
            question: kbQuestion.trim(),
            answer: kbAnswer.trim(),
            category: kbCategory.trim() || null,
          }),
        }
      );
      toast("Added to knowledge base");
      setKbQuestion("");
      setKbAnswer("");
      setKbCategory("From escalation");
      setShowAddKB(false);
    } catch {
      toast("Failed to add to knowledge base", "error");
    } finally {
      setKbSaving(false);
    }
  }

  // Sort: escalated first, then by most recent
  const sorted = [...conversations].sort((a, b) => {
    if (a.status === "escalated" && b.status !== "escalated") return -1;
    if (b.status === "escalated" && a.status !== "escalated") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const neededHumanCount = conversations.filter(neededHuman).length;

  const filterTabs: { label: string; value: StatusFilter; count?: number }[] = [
    { label: "All", value: "all" },
    {
      label: "Escalated",
      value: "escalated",
      count: conversations.filter((c) => c.status === "escalated").length,
    },
    { label: "Active", value: "active" },
    { label: "Resolved", value: "resolved" },
    {
      label: "Needed a human",
      value: "needed_human",
      count: neededHumanCount,
    },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Inbox
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Customer conversations managed by Clink AI
        </p>
      </div>

      {/* Main split — on mobile: show list OR detail; on lg: show both */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel — conversation list (hidden on mobile when detail is shown) */}
        <div
          className={`flex shrink-0 flex-col border-r border-border bg-white shadow-sm lg:w-80 ${
            selectedId ? "hidden lg:flex" : "flex w-full lg:w-80"
          }`}
        >
          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-2 border-b border-border bg-surface/30 px-4 py-3">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setSelectedId(null);
                }}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === tab.value
                    ? "bg-primary text-primary-ink shadow-sm"
                    : "bg-white text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                      statusFilter === tab.value
                        ? "bg-white/25"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conversation rows */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-1 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl bg-surface/50"
                  />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7 text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 5h16v14H4z" />
                    <path d="M4 5l8 7 8-7" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  No conversations yet
                </p>
                <p className="mt-1 text-xs text-muted">
                  New chats will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-3">
                {sorted.map((conv) => {
                  const isSelected = conv.id === selectedId;
                  const branch = branches.find((b) => b.id === conv.branch_id);
                  const initial = (contactLabel(conv.contact)[0] ?? "?").toUpperCase();
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={`w-full rounded-xl px-4 py-3.5 text-left transition-all ${
                        isSelected
                          ? "bg-primary/10 ring-1 ring-primary/20"
                          : "hover:bg-surface/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            isSelected
                              ? "bg-primary text-primary-ink"
                              : "bg-surface text-muted"
                          }`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-foreground">
                              {contactLabel(conv.contact)}
                            </span>
                            <StatusBadge status={conv.status} />
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {conv.contact.phone}
                            {branch ? ` · ${branch.name}` : ""}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                            <span>{timeAgo(conv.created_at)}</span>
                            <span>·</span>
                            <span>
                              {conv.message_count} message
                              {conv.message_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — conversation detail (hidden on mobile when list is shown) */}
        <div
          className={`flex min-w-0 flex-1 flex-col bg-background ${
            selectedId ? "flex w-full" : "hidden lg:flex"
          }`}
        >
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface/50">
                <svg
                  viewBox="0 0 24 24"
                  className="h-10 w-10 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="mt-5 text-base font-medium text-foreground">
                Select a conversation
              </p>
              <p className="mt-1.5 max-w-xs text-sm text-muted">
                Choose a conversation from the list to view messages and reply
              </p>
            </div>
          ) : detailLoading && !detail ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          ) : detail ? (
            <>
              {/* Detail header */}
              <div className="flex items-center justify-between border-b border-border bg-white px-4 py-4 shadow-sm sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  {/* Back button — mobile only */}
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground lg:hidden"
                    aria-label="Back to list"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                    {(contactLabel(detail.contact)[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">
                        {contactLabel(detail.contact)}
                      </h2>
                      <StatusBadge status={detail.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {detail.contact.phone} · {detail.channel}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {detail.status === "escalated" && (
                    <button
                      onClick={handleHandBack}
                      disabled={acting}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      Hand Back to AI
                    </button>
                  )}
                  {detail.status !== "resolved" && (
                    <button
                      onClick={handleResolve}
                      disabled={acting}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>

              {/* Messages thread */}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                <div className="mx-auto max-w-2xl space-y-4">
                  {detail.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Improve AI — Add to knowledge base (when conversation needed a human) */}
              {(detail.status === "escalated" ||
                (detail.status === "resolved" && detail.escalated_at)) && (
                <div className="shrink-0 border-t border-border bg-surface/30 px-4 py-4 sm:px-6">
                  <div className="mx-auto max-w-2xl">
                    {!showAddKB ? (
                      <button
                        type="button"
                        onClick={() => setShowAddKB(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-white px-4 py-3 text-sm font-medium text-primary transition hover:border-primary/50 hover:bg-primary/5"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add to knowledge base — improve AI for next time
                      </button>
                    ) : (
                      <form
                        onSubmit={handleAddToKnowledgeBase}
                        className="rounded-xl border border-border bg-white p-5 shadow-sm"
                      >
                        <h4 className="text-sm font-semibold text-foreground">
                          Add to knowledge base
                        </h4>
                        <p className="mt-0.5 text-xs text-muted">
                          Help the AI handle similar situations better.
                        </p>
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-foreground">
                              Question (what the customer asked/said)
                            </label>
                            <div className="mt-1 flex gap-2">
                              <input
                                type="text"
                                value={kbQuestion}
                                onChange={(e) => setKbQuestion(e.target.value)}
                                placeholder="e.g. Can I cancel my appointment?"
                                required
                                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <button
                                type="button"
                                onClick={suggestQuestionFromConversation}
                                className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface"
                              >
                                Suggest
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground">
                              Answer (how the AI should respond)
                            </label>
                            <textarea
                              value={kbAnswer}
                              onChange={(e) => setKbAnswer(e.target.value)}
                              placeholder="e.g. Cancellations must be made at least 24 hours before..."
                              required
                              rows={3}
                              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground">
                              Category (optional)
                            </label>
                            <input
                              type="text"
                              value={kbCategory}
                              onChange={(e) => setKbCategory(e.target.value)}
                              placeholder="e.g. From escalation"
                              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="submit"
                            disabled={kbSaving}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:brightness-95 disabled:opacity-50"
                          >
                            {kbSaving ? "Saving..." : "Add"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddKB(false);
                              setKbQuestion("");
                              setKbAnswer("");
                              setKbCategory("From escalation");
                            }}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Reply input */}
              {detail.status !== "resolved" && (
                <div className="shrink-0 border-t border-border bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:px-6">
                  <form
                    onSubmit={handleReply}
                    className="mx-auto flex max-w-2xl gap-3"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply as a team member..."
                      className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95 disabled:opacity-50"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </form>
                  {detail.status === "active" && (
                    <p className="mx-auto mt-1.5 max-w-2xl text-[10px] text-muted">
                      This conversation is being handled by AI. Sending a reply
                      won&apos;t automatically escalate it.
                    </p>
                  )}
                </div>
              )}
              {detail.status === "resolved" && (
                <div className="shrink-0 border-t border-border bg-emerald-50/50 px-6 py-3 text-center text-sm text-emerald-800">
                  This conversation was resolved
                  {detail.resolved_at &&
                    ` on ${new Date(detail.resolved_at).toLocaleDateString()}`}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InboxFallback() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="shrink-0 border-b border-border bg-white px-6 py-5 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded bg-surface" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-surface" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<InboxFallback />}>
      <InboxContent />
    </Suspense>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    escalated: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    resolved: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      {status}
    </span>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isCustomer = message.role === "customer";
  const isAgent = message.role === "agent";

  return (
    <div className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isCustomer
            ? "rounded-bl-md border border-border bg-white text-foreground"
            : isAgent
              ? "rounded-br-md bg-primary/10 text-foreground"
              : "rounded-br-md bg-primary text-primary-ink"
        }`}
      >
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            {message.role === "customer"
              ? "Customer"
              : message.role === "agent"
                ? "AI Agent"
                : "Team"}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isCustomer ? "text-muted" : "opacity-50"
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
