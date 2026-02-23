"use client";

import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/toast";

interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  timezone: string;
  status: string;
}

const TIMEZONES = [
  "UTC",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Seoul",
  "Asia/Jakarta",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export default function CompanySettingsPage() {
  const { data: session } = useSession();
  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const companyId = session?.companyId;

  useEffect(() => {
    if (!companyId) return;
    async function load() {
      try {
        const data = await api<Company>(`/companies/${companyId}`);
        setCompany(data);
        setName(data.name);
        setTimezone(data.timezone);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [companyId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    try {
      const updated = await api<Company>(`/companies/${companyId}`, {
        method: "PUT",
        body: JSON.stringify({ name, timezone }),
      });
      setCompany(updated);
      toast("Company settings saved");
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground">
          Company Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {company?.slug && (
        <div>
          <label className="block text-sm font-medium text-foreground">
            Slug
          </label>
          <p className="mt-1.5 text-sm text-muted">{company.slug}</p>
        </div>
      )}

      {company?.domain && (
        <div>
          <label className="block text-sm font-medium text-foreground">
            Domain
          </label>
          <p className="mt-1.5 text-sm text-muted">{company.domain}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
