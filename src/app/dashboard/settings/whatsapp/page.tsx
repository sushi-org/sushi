"use client";

import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/toast";

interface Branch {
  id: string;
  name: string;
}

interface WhatsAppAccount {
  id: string;
  branch_id: string;
  company_id: string;
  waba_id: string;
  phone_number_id: string;
  display_phone: string;
  status: "pending" | "active" | "disconnected";
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function WhatsAppSettingsPage() {
  const { data: session } = useSession();
  const companyId = session?.companyId;

  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formBranchId, setFormBranchId] = useState("");
  const [formWabaId, setFormWabaId] = useState("");
  const [formPhoneNumberId, setFormPhoneNumberId] = useState("");
  const [formDisplayPhone, setFormDisplayPhone] = useState("");

  async function loadData() {
    if (!companyId) return;
    try {
      const [acctData, branchData] = await Promise.all([
        api<WhatsAppAccount[]>(`/companies/${companyId}/whatsapp/accounts`),
        api<Branch[]>(`/companies/${companyId}/branches`),
      ]);
      setAccounts(acctData);
      setBranches(branchData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [companyId]);

  function resetForm() {
    setFormBranchId("");
    setFormWabaId("");
    setFormPhoneNumberId("");
    setFormDisplayPhone("");
    setShowForm(false);
  }

  const connectedBranchIds = new Set(
    accounts.filter((a) => a.status !== "disconnected").map((a) => a.branch_id)
  );
  const availableBranches = branches.filter((b) => !connectedBranchIds.has(b.id));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/companies/${companyId}/whatsapp/accounts`, {
        method: "POST",
        body: JSON.stringify({
          branch_id: formBranchId,
          waba_id: formWabaId,
          phone_number_id: formPhoneNumberId,
          display_phone: formDisplayPhone,
        }),
      });
      resetForm();
      await loadData();
      toast("WhatsApp account connected");
    } catch {
      toast("Failed to connect account", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect(id: string) {
    if (!confirm("Disconnect this WhatsApp account? The bot will stop responding on this number.")) return;
    try {
      await api(`/companies/${companyId}/whatsapp/accounts/${id}`, { method: "DELETE" });
      await loadData();
      toast("Account disconnected");
    } catch {
      toast("Failed to disconnect", "error");
    }
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  const activeAccounts = accounts.filter((a) => a.status !== "disconnected");

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {activeAccounts.length} connected account(s)
        </p>
        {availableBranches.length > 0 && (
          <button
            onClick={() => {
              resetForm();
              setFormBranchId(availableBranches[0]?.id ?? "");
              setShowForm(true);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95"
          >
            Connect Branch
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <h3 className="text-base font-semibold text-foreground">
            Connect WhatsApp Number
          </h3>
          <p className="mt-1 text-sm text-muted">
            Enter the details from your Meta Business Manager after completing
            the onboarding steps.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Branch
              </label>
              <select
                value={formBranchId}
                onChange={(e) => setFormBranchId(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="" disabled>
                  Select a branch
                </option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Display Phone Number
              </label>
              <input
                type="text"
                value={formDisplayPhone}
                onChange={(e) => setFormDisplayPhone(e.target.value)}
                placeholder="+65 9123 4567"
                required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                WABA ID
              </label>
              <input
                type="text"
                value={formWabaId}
                onChange={(e) => setFormWabaId(e.target.value)}
                placeholder="109876543210"
                required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted">
                WhatsApp Business Account ID from Meta
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Phone Number ID
              </label>
              <input
                type="text"
                value={formPhoneNumberId}
                onChange={(e) => setFormPhoneNumberId(e.target.value)}
                placeholder="106789012345"
                required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted">
                Meta Phone Number ID used for webhook routing
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:brightness-95 disabled:opacity-50"
            >
              {saving ? "Connecting..." : "Connect"}
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

      {activeAccounts.length === 0 && !showForm ? (
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
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            No WhatsApp accounts connected
          </h2>
          <p className="mt-1 max-w-sm text-center text-sm text-muted">
            Connect a WhatsApp Business number to a branch to enable AI-powered
            customer conversations.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface/50">
              <tr>
                <th className="px-4 py-3 font-medium text-muted">Branch</th>
                <th className="px-4 py-3 font-medium text-muted">Phone</th>
                <th className="px-4 py-3 font-medium text-muted">
                  Phone Number ID
                </th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeAccounts.map((acct) => {
                const branch = branches.find((b) => b.id === acct.branch_id);
                return (
                  <tr key={acct.id} className="hover:bg-surface/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {branch?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {acct.display_phone}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {acct.phone_number_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          acct.status === "active"
                            ? "bg-green-50 text-green-700"
                            : acct.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {acct.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDisconnect(acct.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Disconnect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
