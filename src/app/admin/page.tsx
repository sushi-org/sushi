"use client";

import { useSession, signOut } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/toast";

interface WhatsAppConfig {
  id: string;
  access_token_masked: string;
  verify_token_masked: string;
  updated_at: string;
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
}

export default function AdminPage() {
  const { data: session } = useSession();

  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Config form
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [formAccessToken, setFormAccessToken] = useState("");
  const [formVerifyToken, setFormVerifyToken] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  // Action loading
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadData() {
    try {
      const [cfgData, acctData] = await Promise.all([
        adminApi<WhatsAppConfig | null>("/admin/whatsapp/config"),
        adminApi<WhatsAppAccount[]>("/admin/whatsapp/accounts"),
      ]);
      setConfig(cfgData);
      setAccounts(acctData);
    } catch {
      toast("Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleConfigSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const body: Record<string, string> = {};
      if (formAccessToken) body.access_token = formAccessToken;
      if (formVerifyToken) body.verify_token = formVerifyToken;

      if (Object.keys(body).length === 0) {
        toast("Enter at least one token to update", "error");
        setSavingConfig(false);
        return;
      }

      const updated = await adminApi<WhatsAppConfig>("/admin/whatsapp/config", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setConfig(updated);
      setFormAccessToken("");
      setFormVerifyToken("");
      setShowConfigForm(false);
      toast("WhatsApp config updated");
    } catch {
      toast("Failed to update config", "error");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleApprove(accountId: string) {
    setActionId(accountId);
    try {
      await adminApi(`/admin/whatsapp/accounts/${accountId}/approve`, {
        method: "POST",
      });
      await loadData();
      toast("Account approved — app subscribed to WABA webhooks");
    } catch {
      toast("Failed to approve account", "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(accountId: string) {
    if (!confirm("Disconnect this account? It will no longer receive messages.")) return;
    setActionId(accountId);
    try {
      await adminApi(`/admin/whatsapp/accounts/${accountId}`, {
        method: "DELETE",
      });
      await loadData();
      toast("Account disconnected");
    } catch {
      toast("Failed to disconnect account", "error");
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
        <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
      </div>
    );
  }

  const pendingAccounts = accounts.filter((a) => a.status === "pending");
  const activeAccounts = accounts.filter((a) => a.status === "active");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Admin Console
          </h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {session?.user?.email}
            </span>
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface"
        >
          Sign out
        </button>
      </div>

      {/* WhatsApp Config Section */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          WhatsApp Configuration
        </h2>
        <p className="mt-1 text-sm text-muted">
          Global access token and webhook verify token for the WhatsApp Cloud
          API.
        </p>

        <div className="mt-4 rounded-xl border border-border bg-white p-5">
          {config ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Access Token
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-foreground">
                    {config.access_token_masked}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Verify Token
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-foreground">
                    {config.verify_token_masked}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Last updated</p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {new Date(config.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {!showConfigForm && (
                <button
                  onClick={() => setShowConfigForm(true)}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Update tokens
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted">
                No WhatsApp config found. Set your tokens to get started.
              </p>
              {!showConfigForm && (
                <button
                  onClick={() => setShowConfigForm(true)}
                  className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95"
                >
                  Configure Tokens
                </button>
              )}
            </div>
          )}

          {showConfigForm && (
            <form onSubmit={handleConfigSubmit} className="mt-4 border-t border-border pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Access Token
                  </label>
                  <input
                    type="password"
                    value={formAccessToken}
                    onChange={(e) => setFormAccessToken(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Verify Token
                  </label>
                  <input
                    type="text"
                    value={formVerifyToken}
                    onChange={(e) => setFormVerifyToken(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:brightness-95 disabled:opacity-50"
                >
                  {savingConfig ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigForm(false);
                    setFormAccessToken("");
                    setFormVerifyToken("");
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Pending Approvals Section */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          Pending Approvals
        </h2>
        <p className="mt-1 text-sm text-muted">
          WhatsApp integrations waiting for admin approval before they can
          receive messages.
        </p>

        {pendingAccounts.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-white py-12 text-center">
            <p className="text-sm text-muted">No pending approvals.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {pendingAccounts.map((acct) => (
              <div
                key={acct.id}
                className="flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50/50 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      pending
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {acct.display_phone}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>
                      WABA: <span className="font-mono">{acct.waba_id}</span>
                    </span>
                    <span>
                      Phone Number ID:{" "}
                      <span className="font-mono">{acct.phone_number_id}</span>
                    </span>
                    <span>
                      Company:{" "}
                      <span className="font-mono text-foreground">
                        {acct.company_id.slice(0, 8)}...
                      </span>
                    </span>
                    <span>
                      Submitted{" "}
                      {new Date(acct.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleApprove(acct.id)}
                    disabled={actionId === acct.id}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionId === acct.id ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(acct.id)}
                    disabled={actionId === acct.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Accounts Section */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          Active Accounts
        </h2>
        <p className="mt-1 text-sm text-muted">
          All approved WhatsApp integrations currently receiving messages.
        </p>

        {activeAccounts.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-white py-12 text-center">
            <p className="text-sm text-muted">No active accounts yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted">Phone</th>
                  <th className="px-4 py-3 font-medium text-muted">
                    Phone Number ID
                  </th>
                  <th className="px-4 py-3 font-medium text-muted">WABA ID</th>
                  <th className="px-4 py-3 font-medium text-muted">
                    Verified
                  </th>
                  <th className="px-4 py-3 font-medium text-muted"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeAccounts.map((acct) => (
                  <tr key={acct.id} className="hover:bg-surface/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {acct.display_phone}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {acct.phone_number_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {acct.waba_id}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {acct.verified_at
                        ? new Date(acct.verified_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleReject(acct.id)}
                        disabled={actionId === acct.id}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
