"use client";

import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/toast";

interface Service {
  id: string;
  name: string;
  description: string | null;
  default_price: string;
  default_duration_minutes: number;
  currency: string;
  status: string;
}

export default function ServicesSettingsPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("60");
  const [formCurrency, setFormCurrency] = useState("SGD");
  const [saving, setSaving] = useState(false);

  const companyId = session?.companyId;

  async function loadServices() {
    if (!companyId) return;
    try {
      const data = await api<Service[]>(`/companies/${companyId}/services`);
      setServices(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadServices(); }, [companyId]);

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormDuration("60");
    setFormCurrency("SGD");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(svc: Service) {
    setFormName(svc.name);
    setFormDescription(svc.description ?? "");
    setFormPrice(svc.default_price);
    setFormDuration(String(svc.default_duration_minutes));
    setFormCurrency(svc.currency);
    setEditingId(svc.id);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    try {
      const body = {
        name: formName,
        description: formDescription || null,
        default_price: parseFloat(formPrice),
        default_duration_minutes: parseInt(formDuration),
        currency: formCurrency,
      };
      if (editingId) {
        await api(`/companies/${companyId}/services/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api(`/companies/${companyId}/services`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await loadServices();
      toast(editingId ? "Service updated" : "Service created");
    } catch {
      toast("Failed to save service", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!companyId || !confirm("Delete this service?")) return;
    await api(`/companies/${companyId}/services/${id}`, { method: "DELETE" });
    await loadServices();
    toast("Service deleted");
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{services.length} service(s)</p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95"
        >
          Add Service
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">
            {editingId ? "Edit Service" : "New Service"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Price</label>
              <input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Duration (minutes)</label>
              <input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Currency</label>
              <input type="text" value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} required
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground">Description</label>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
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

      {services.length === 0 && !showForm ? (
        <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-white py-16">
          <p className="text-sm text-muted">No services yet. Add your first bookable service.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface/50">
              <tr>
                <th className="px-4 py-3 font-medium text-muted">Name</th>
                <th className="px-4 py-3 font-medium text-muted">Price</th>
                <th className="px-4 py-3 font-medium text-muted">Duration</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-surface/30">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-foreground">{s.currency} {s.default_price}</td>
                  <td className="px-4 py-3 text-foreground">{s.default_duration_minutes} min</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(s)} className="text-xs font-medium text-primary hover:underline">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="ml-3 text-xs font-medium text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
