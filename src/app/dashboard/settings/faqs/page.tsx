"use client";

import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/toast";
import { useBranch } from "@/contexts/branch-context";

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function FaqsSettingsPage() {
  const { data: session } = useSession();
  const { branches, selectedBranchId } = useBranch();
  const companyId = session?.companyId;

  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasAgent, setHasAgent] = useState(false);

  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formCategory, setFormCategory] = useState("");

  async function loadEntries() {
    if (!companyId || !selectedBranchId) return;
    setLoading(true);
    try {
      await api(`/companies/${companyId}/branches/${selectedBranchId}/agent`);
      setHasAgent(true);
      const data = await api<KnowledgeEntry[]>(
        `/companies/${companyId}/branches/${selectedBranchId}/agent/knowledge`
      );
      setEntries(data.filter((e) => e.status === "active"));
    } catch {
      setHasAgent(false);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, [companyId, selectedBranchId]);

  function resetForm() {
    setFormQuestion("");
    setFormAnswer("");
    setFormCategory("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(entry: KnowledgeEntry) {
    setFormQuestion(entry.question);
    setFormAnswer(entry.answer);
    setFormCategory(entry.category ?? "");
    setEditingId(entry.id);
    setShowForm(true);
  }

  async function ensureAgent() {
    if (hasAgent || !companyId || !selectedBranchId) return;
    await api(
      `/companies/${companyId}/branches/${selectedBranchId}/agent`,
      {
        method: "PUT",
        body: JSON.stringify({ name: "AI Receptionist" }),
      }
    );
    setHasAgent(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId || !selectedBranchId) return;
    setSaving(true);
    try {
      await ensureAgent();
      const body = {
        question: formQuestion,
        answer: formAnswer,
        category: formCategory || null,
      };
      if (editingId) {
        await api(
          `/companies/${companyId}/branches/${selectedBranchId}/agent/knowledge/${editingId}`,
          { method: "PUT", body: JSON.stringify(body) }
        );
      } else {
        await api(
          `/companies/${companyId}/branches/${selectedBranchId}/agent/knowledge`,
          { method: "POST", body: JSON.stringify(body) }
        );
      }
      resetForm();
      await loadEntries();
      toast(editingId ? "FAQ updated" : "FAQ added");
    } catch {
      toast("Failed to save FAQ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!companyId || !selectedBranchId || !confirm("Delete this FAQ?")) return;
    try {
      await api(
        `/companies/${companyId}/branches/${selectedBranchId}/agent/knowledge/${id}`,
        { method: "DELETE" }
      );
      await loadEntries();
      toast("FAQ deleted");
    } catch {
      toast("Failed to delete FAQ", "error");
    }
  }

  if (!selectedBranchId) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-white py-16">
        <p className="text-sm text-muted">
          Select a branch from the sidebar to manage its knowledge base.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
    );
  }

  const branchName =
    branches.find((b) => b.id === selectedBranchId)?.name ?? "this branch";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">
            {entries.length} FAQ(s) for{" "}
            <span className="font-medium text-foreground">{branchName}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            These questions and answers are used by the AI agent when responding
            to customers.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95"
        >
          Add FAQ
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <h3 className="text-base font-semibold text-foreground">
            {editingId ? "Edit FAQ" : "New FAQ"}
          </h3>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Question
              </label>
              <input
                type="text"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                placeholder="What is your cancellation policy?"
                required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Answer
              </label>
              <textarea
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                placeholder="Cancellations must be made at least 24 hours before the appointment..."
                required
                rows={3}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-foreground">
                Category
                <span className="ml-1 font-normal text-muted">(optional)</span>
              </label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. policies, pricing, services"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:brightness-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 && !showForm ? (
        <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-white py-16">
          <svg
            viewBox="0 0 24 24"
            className="h-12 w-12 text-border"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            No FAQs yet
          </h2>
          <p className="mt-1 max-w-sm text-center text-sm text-muted">
            Add questions and answers that the AI agent will reference when
            responding to customer inquiries for {branchName}.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {entry.question}
                  </h4>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">
                    {entry.answer}
                  </p>
                  {entry.category && (
                    <span className="mt-2 inline-flex rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                      {entry.category}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(entry)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
