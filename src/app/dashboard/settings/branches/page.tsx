"use client";

import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/toast";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  timezone: string;
  operating_hours: Record<string, { open: string; close: string } | null>;
  status: string;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const EMPTY_HOURS: Record<string, { open: string; close: string } | null> = {
  monday: { open: "09:00", close: "18:00" },
  tuesday: { open: "09:00", close: "18:00" },
  wednesday: { open: "09:00", close: "18:00" },
  thursday: { open: "09:00", close: "18:00" },
  friday: { open: "09:00", close: "18:00" },
  saturday: null,
  sunday: null,
};

export default function BranchesSettingsPage() {
  const { data: session } = useSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formTimezone, setFormTimezone] = useState("Asia/Singapore");
  const [formHours, setFormHours] = useState<Record<string, { open: string; close: string } | null>>({ ...EMPTY_HOURS });
  const [saving, setSaving] = useState(false);

  const companyId = session?.companyId;

  async function loadBranches() {
    if (!companyId) return;
    try {
      const data = await api<Branch[]>(`/companies/${companyId}/branches`);
      setBranches(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBranches(); }, [companyId]);

  function resetForm() {
    setFormName("");
    setFormAddress("");
    setFormPhone("");
    setFormTimezone("Asia/Singapore");
    setFormHours({ ...EMPTY_HOURS });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(branch: Branch) {
    setFormName(branch.name);
    setFormAddress(branch.address);
    setFormPhone(branch.phone ?? "");
    setFormTimezone(branch.timezone);
    setFormHours(branch.operating_hours ?? { ...EMPTY_HOURS });
    setEditingId(branch.id);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    try {
      const body = {
        name: formName,
        address: formAddress,
        phone: formPhone || null,
        timezone: formTimezone,
        operating_hours: formHours,
      };
      if (editingId) {
        await api(`/companies/${companyId}/branches/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api(`/companies/${companyId}/branches`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await loadBranches();
      toast(editingId ? "Branch updated" : "Branch created");
    } catch {
      toast("Failed to save branch", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!companyId || !confirm("Delete this branch?")) return;
    await api(`/companies/${companyId}/branches/${id}`, { method: "DELETE" });
    await loadBranches();
    toast("Branch deleted");
  }

  function toggleDay(day: string) {
    setFormHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: "09:00", close: "18:00" },
    }));
  }

  function setHourField(day: string, field: "open" | "close", value: string) {
    setFormHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { open: "09:00", close: "18:00", [field]: value },
    }));
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{branches.length} branch(es)</p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95"
        >
          Add Branch
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            {editingId ? "Edit Branch" : "New Branch"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Address</label>
              <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Phone</label>
              <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Timezone</label>
              <input type="text" value={formTimezone} onChange={(e) => setFormTimezone(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-foreground">Operating Hours</label>
            <div className="mt-2 space-y-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <label className="flex w-28 items-center gap-2 text-sm capitalize text-foreground">
                    <input type="checkbox" checked={!!formHours[day]} onChange={() => toggleDay(day)}
                      className="rounded border-border" />
                    {day}
                  </label>
                  {formHours[day] ? (
                    <div className="flex items-center gap-2">
                      <input type="time" value={formHours[day]!.open} onChange={(e) => setHourField(day, "open", e.target.value)}
                        className="rounded border border-border px-2 py-1 text-sm" />
                      <span className="text-sm text-muted">to</span>
                      <input type="time" value={formHours[day]!.close} onChange={(e) => setHourField(day, "close", e.target.value)}
                        className="rounded border border-border px-2 py-1 text-sm" />
                    </div>
                  ) : (
                    <span className="text-sm text-muted">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:brightness-95 disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button type="button" onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface">
              Cancel
            </button>
          </div>
        </form>
      )}

      {branches.length === 0 && !showForm ? (
        <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-white py-16">
          <p className="text-sm text-muted">No branches yet. Add your first branch.</p>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-border bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted">Name</th>
                  <th className="px-4 py-3 font-medium text-muted">Address</th>
                  <th className="px-4 py-3 font-medium text-muted">Phone</th>
                  <th className="px-4 py-3 font-medium text-muted">Status</th>
                  <th className="px-4 py-3 font-medium text-muted"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-surface/30">
                    <td className="px-4 py-3 font-medium text-foreground">{b.name}</td>
                    <td className="px-4 py-3 text-foreground">{b.address}</td>
                    <td className="px-4 py-3 text-foreground">{b.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${b.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(b)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                      <button onClick={() => handleDelete(b.id)} className="ml-3 text-xs font-medium text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: cards */}
          <div className="mt-6 space-y-3 md:hidden">
            {branches.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="font-medium text-foreground">{b.name}</div>
                <div className="mt-0.5 text-sm text-muted">{b.address}</div>
                <div className="mt-0.5 text-sm text-muted">{b.phone ?? "—"}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${b.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
                    {b.status}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(b)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                    <button onClick={() => handleDelete(b.id)} className="text-xs font-medium text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
