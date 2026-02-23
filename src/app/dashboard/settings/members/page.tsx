"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/toast";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

interface InviteItem {
  id: string;
  code: string;
  status: string;
  created_by: string;
  expires_at: string;
  created_at: string;
}

export default function MembersPage() {
  const { data: session } = useSession();
  const companyId = session?.companyId;

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadMembers = useCallback(async () => {
    if (!companyId) return;
    const data = await api<MemberItem[]>(`/companies/${companyId}/members`);
    setMembers(data);
  }, [companyId]);

  const loadInvites = useCallback(async () => {
    if (!companyId) return;
    const data = await api<InviteItem[]>(`/companies/${companyId}/invites`);
    setInvites(data);
  }, [companyId]);

  useEffect(() => {
    loadMembers();
    loadInvites();
  }, [loadMembers, loadInvites]);

  async function handleCreateInvite() {
    if (!companyId) return;
    setCreatingInvite(true);
    setError("");
    try {
      await api<InviteItem>(`/companies/${companyId}/invites`, {
        method: "POST",
        headers: { "x-member-id": session?.memberId ?? "" },
        body: JSON.stringify({ expires_in_days: 7 }),
      });
      await loadInvites();
      toast("Invite created");
    } catch {
      toast("Failed to create invite", "error");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!companyId) return;
    try {
      await api(`/companies/${companyId}/invites/${inviteId}`, {
        method: "DELETE",
      });
      await loadInvites();
      toast("Invite revoked");
    } catch {
      toast("Failed to revoke invite", "error");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!companyId) return;
    if (!confirm("Remove this member from the company?")) return;
    try {
      await api(`/companies/${companyId}/members/${memberId}`, {
        method: "DELETE",
      });
      await loadMembers();
      toast("Member removed");
    } catch {
      toast("Failed to remove member", "error");
    }
  }

  function copyToClipboard(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      {/* Members list */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Members</h2>
            <p className="text-sm text-muted">
              {members.length} member{members.length !== 1 && "s"} in your
              company.
            </p>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {m.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      {m.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{m.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(m.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.id !== session?.memberId && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invites */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Invite Links
            </h2>
            <p className="text-sm text-muted">
              Generate invite codes for new team members. Codes expire after 7
              days.
            </p>
          </div>
          <button
            onClick={handleCreateInvite}
            disabled={creatingInvite}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95 disabled:opacity-50"
          >
            {creatingInvite ? "Creating..." : "Generate Invite"}
          </button>
        </div>

        {invites.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted/20 px-2 py-1 text-sm font-mono tracking-widest">
                        {inv.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.status === "active"
                            ? "bg-green-50 text-green-700"
                            : inv.status === "used"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(inv.expires_at)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyToClipboard(inv.code, inv.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          {copiedId === inv.id ? "Copied!" : "Copy"}
                        </button>
                        {inv.status === "active" && (
                          <button
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {invites.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
            No active invites. Click &quot;Generate Invite&quot; to create one.
          </div>
        )}
      </section>
    </div>
  );
}
