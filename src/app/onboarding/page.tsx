"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface CompanyResponse {
  id: string;
  name: string;
  slug: string;
}

interface InviteAcceptResponse {
  company_id: string;
  company_name: string;
  member_id: string;
}

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<"create" | "invite">("create");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const memberName = session?.user?.name ?? "there";

  async function handleCreateCompany(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const company = await api<CompanyResponse>("/companies", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          timezone: tz,
          member_id: session?.memberId,
        }),
      });
      await update({ companyId: company.id });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(
          "A company with this name already exists. If you belong to this company, ask an existing member to send you an invite code."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptInvite(e: FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const result = await api<InviteAcceptResponse>("/invites/accept", {
        method: "POST",
        body: JSON.stringify({
          code: inviteCode.trim().toUpperCase(),
          member_id: session?.memberId,
        }),
      });
      await update({ companyId: result.company_id });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Invalid or expired invite code. Please check and try again.");
        } else if (err.status === 400) {
          setError("You are already part of a company.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#e8f1f9_0%,#f1f5f9_44%,#f1f5f9_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-[0_20px_55px_-28px_rgba(28,61,88,0.28)]">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome to Clink, {memberName}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "create"
            ? "Let's set up your business. You can always change this later."
            : "Enter the invite code you received from your team."}
        </p>

        {mode === "create" ? (
          <form onSubmit={handleCreateCompany} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="company-name"
                className="block text-sm font-medium text-foreground"
              >
                What&apos;s your business name?
              </label>
              <input
                id="company-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Glow Beauty"
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Company"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("invite");
                  setError("");
                }}
                className="text-sm text-primary hover:underline"
              >
                Have an invite code?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAcceptInvite} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="invite-code"
                className="block text-sm font-medium text-foreground"
              >
                Invite code
              </label>
              <input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. ABC123"
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm tracking-widest text-foreground uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join Company"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("create");
                  setError("");
                }}
                className="text-sm text-primary hover:underline"
              >
                Create a new company instead
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
