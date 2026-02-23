"use client";

import { useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/toast";

interface Staff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string;
}

interface StaffServiceAssignment {
  id: string;
  staff_id: string;
  service_id: string;
  price_override: string | null;
  duration_override: number | null;
}

interface ServiceItem {
  id: string;
  name: string;
}

interface AvailabilitySlot {
  id: string;
  branch_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Branch {
  id: string;
  name: string;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type AvailabilityDraft = {
  enabled: boolean;
  start: string;
  end: string;
};

function emptyWeek(): AvailabilityDraft[] {
  return DAY_LABELS.map(() => ({
    enabled: false,
    start: "09:00",
    end: "18:00",
  }));
}

function weekFromSlots(slots: AvailabilitySlot[]): AvailabilityDraft[] {
  const week = DAY_LABELS.map(() => ({ enabled: false, start: "09:00", end: "18:00" }));
  for (const s of slots) {
    week[s.day_of_week] = {
      enabled: true,
      start: s.start_time.slice(0, 5),
      end: s.end_time.slice(0, 5),
    };
  }
  return week;
}

export default function StaffSettingsPage() {
  const { data: session } = useSession();
  const companyId = session?.companyId;

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);

  // Form — profile
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");

  // Form — services
  const [assignments, setAssignments] = useState<StaffServiceAssignment[]>([]);

  // Form — availability (per-branch cache to preserve state when switching)
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branchDrafts, setBranchDrafts] = useState<Record<string, AvailabilityDraft[]>>({});
  const [availSaving, setAvailSaving] = useState(false);
  const [availError, setAvailError] = useState("");

  const weekDraft = selectedBranch ? (branchDrafts[selectedBranch] ?? emptyWeek()) : emptyWeek();

  function setWeekDraft(updater: AvailabilityDraft[] | ((prev: AvailabilityDraft[]) => AvailabilityDraft[])) {
    if (!selectedBranch) return;
    setBranchDrafts((prev) => {
      const current = prev[selectedBranch] ?? emptyWeek();
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [selectedBranch]: next };
    });
  }

  const loadStaff = useCallback(async () => {
    if (!companyId) return;
    try {
      const data = await api<Staff[]>(`/companies/${companyId}/staff`);
      setStaffList(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadSupport = useCallback(async () => {
    if (!companyId) return;
    try {
      const [svcData, branchData] = await Promise.all([
        api<ServiceItem[]>(`/companies/${companyId}/services`),
        api<Branch[]>(`/companies/${companyId}/branches`),
      ]);
      setServices(svcData);
      setBranches(branchData);
      if (branchData.length > 0) setSelectedBranch(branchData[0].id);
    } catch { /* ignore */ }
  }, [companyId]);

  useEffect(() => { loadStaff(); loadSupport(); }, [loadStaff, loadSupport]);

  async function loadStaffDetail(staffId: string) {
    if (!companyId) return;
    try {
      const [assignData, availData] = await Promise.all([
        api<StaffServiceAssignment[]>(`/companies/${companyId}/staff/${staffId}/services`),
        api<AvailabilitySlot[]>(`/companies/${companyId}/staff/${staffId}/availability`),
      ]);
      setAssignments(assignData);

      const draftsMap: Record<string, AvailabilityDraft[]> = {};
      for (const b of branches) {
        const branchSlots = availData.filter((a) => a.branch_id === b.id);
        draftsMap[b.id] = branchSlots.length > 0 ? weekFromSlots(branchSlots) : emptyWeek();
      }
      setBranchDrafts(draftsMap);
    } catch { /* ignore */ }
  }

  function openNewStaff() {
    setEditingStaff(null);
    setFormName(""); setFormEmail(""); setFormPhone("");
    setAssignments([]);
    setBranchDrafts({});
    setPanelOpen(true);
  }

  async function openEditStaff(staff: Staff) {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormEmail(staff.email ?? "");
    setFormPhone(staff.phone ?? "");
    setPanelOpen(true);
    await loadStaffDetail(staff.id);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingStaff(null);
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    try {
      const body = { name: formName, email: formEmail || null, phone: formPhone || null };
      let staff: Staff;
      if (editingStaff) {
        staff = await api<Staff>(`/companies/${companyId}/staff/${editingStaff.id}`, {
          method: "PUT", body: JSON.stringify(body),
        });
      } else {
        staff = await api<Staff>(`/companies/${companyId}/staff`, {
          method: "POST", body: JSON.stringify(body),
        });
      }
      setEditingStaff(staff);
      await loadStaff();
      toast(editingStaff ? "Profile updated" : "Staff created");
    } catch {
      toast("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!companyId || !editingStaff || !confirm("Delete this staff member?")) return;
    await api(`/companies/${companyId}/staff/${editingStaff.id}`, { method: "DELETE" });
    closePanel();
    await loadStaff();
    toast("Staff deleted");
  }

  // Service management
  async function assignService(serviceId: string) {
    if (!companyId || !editingStaff) return;
    await api(`/companies/${companyId}/staff/${editingStaff.id}/services`, {
      method: "POST", body: JSON.stringify({ service_id: serviceId }),
    });
    await loadStaffDetail(editingStaff.id);
  }

  async function removeAssignment(serviceId: string) {
    if (!companyId || !editingStaff) return;
    await api(`/companies/${companyId}/staff/${editingStaff.id}/services/${serviceId}`, {
      method: "DELETE",
    });
    await loadStaffDetail(editingStaff.id);
  }

  // Availability management
  function updateDay(idx: number, patch: Partial<AvailabilityDraft>) {
    setWeekDraft((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function findCrossBranchOverlaps(): string | null {
    const currentDraft = weekDraft;
    for (const [branchId, otherDraft] of Object.entries(branchDrafts)) {
      if (branchId === selectedBranch) continue;
      const otherBranch = branches.find((b) => b.id === branchId);
      for (let day = 0; day < 7; day++) {
        const cur = currentDraft[day];
        const other = otherDraft[day];
        if (!cur.enabled || !other.enabled) continue;
        if (cur.start < other.end && cur.end > other.start) {
          return `${DAY_LABELS[day]} ${cur.start}–${cur.end} overlaps with ${otherBranch?.name ?? "another branch"} (${other.start}–${other.end})`;
        }
      }
    }
    return null;
  }

  async function saveAvailability() {
    if (!companyId || !editingStaff || !selectedBranch) return;

    const overlap = findCrossBranchOverlaps();
    if (overlap) {
      setAvailError(`Time conflict: ${overlap}. A staff member cannot be at two branches at the same time.`);
      return;
    }

    setAvailSaving(true);
    setAvailError("");
    try {
      const slots = weekDraft
        .map((d, i) => d.enabled ? { day_of_week: i, start_time: d.start + ":00", end_time: d.end + ":00" } : null)
        .filter(Boolean);
      await api(`/companies/${companyId}/staff/${editingStaff.id}/availability`, {
        method: "POST",
        body: JSON.stringify({ branch_id: selectedBranch, slots }),
      });
      setAvailError("");
      toast("Availability saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      const match = msg.match(/"detail"\s*:\s*"([^"]+)"/);
      setAvailError(match ? match[1] : msg);
    } finally {
      setAvailSaving(false);
    }
  }

  function onBranchChange(branchId: string) {
    setSelectedBranch(branchId);
    setAvailError("");
  }

  const assignedServiceIds = new Set(assignments.map((a) => a.service_id));
  const unassignedServices = services.filter((s) => !assignedServiceIds.has(s.id));

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  return (
    <div>
      {!panelOpen && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{staffList.length} staff member(s)</p>
          <button onClick={openNewStaff}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm hover:brightness-95">
            Add Staff
          </button>
        </div>
      )}

      {/* Staff list table */}
      {staffList.length === 0 && !panelOpen ? (
        <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-white py-16">
          <p className="text-sm text-muted">No staff yet. Add your first staff member.</p>
        </div>
      ) : !panelOpen && (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface/50">
              <tr>
                <th className="px-4 py-3 font-medium text-muted">Name</th>
                <th className="px-4 py-3 font-medium text-muted">Email</th>
                <th className="px-4 py-3 font-medium text-muted">Phone</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffList.map((s) => (
                <tr key={s.id} className="cursor-pointer hover:bg-surface/30" onClick={() => openEditStaff(s)}>
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-foreground">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openEditStaff(s); }}
                      className="text-xs font-medium text-primary hover:underline">Edit</button>
                    <button onClick={async (e) => { e.stopPropagation(); if (!companyId || !confirm("Delete this staff member?")) return; await api(`/companies/${companyId}/staff/${s.id}`, { method: "DELETE" }); await loadStaff(); }}
                      className="ml-3 text-xs font-medium text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit panel ── */}
      {panelOpen && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {editingStaff ? `Edit: ${editingStaff.name}` : "New Staff Member"}
            </h3>
            <div className="flex gap-2">
              {editingStaff && (
                <button onClick={handleDelete}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  Delete
                </button>
              )}
              <button onClick={closePanel}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface">
                Back to list
              </button>
            </div>
          </div>

          {/* Section 1: Profile */}
          <form onSubmit={handleProfileSave} className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h4 className="text-sm font-semibold text-foreground">Profile</h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-muted">Name</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted">Email</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted">Phone</label>
                <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:brightness-95 disabled:opacity-50">
                {saving ? "Saving..." : editingStaff ? "Update Profile" : "Create Staff"}
              </button>
            </div>
          </form>

          {/* Section 2 & 3 only show after staff is saved (has an ID) */}
          {editingStaff && (
            <>
              {/* Section 2: Assigned Services */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h4 className="text-sm font-semibold text-foreground">Assigned Services</h4>
                {assignments.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No services assigned yet.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignments.map((a) => {
                      const svc = services.find((s) => s.id === a.service_id);
                      return (
                        <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/50 px-3 py-1 text-sm text-foreground">
                          {svc?.name ?? "Unknown"}
                          <button onClick={() => removeAssignment(a.service_id)}
                            className="ml-0.5 text-muted hover:text-red-600" title="Remove">
                            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/></svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                {unassignedServices.length > 0 && (
                  <div className="mt-4">
                    <select
                      onChange={(e) => { if (e.target.value) { assignService(e.target.value); e.target.value = ""; } }}
                      className="rounded-lg border border-border px-3 py-2 text-sm text-foreground"
                      defaultValue=""
                    >
                      <option value="" disabled>Add a service...</option>
                      {unassignedServices.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Section 3: Weekly Availability */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Weekly Availability</h4>
                  {branches.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted">Branch</span>
                      <select value={selectedBranch} onChange={(e) => onBranchChange(e.target.value)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground">
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {branches.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">Create a branch first to set availability.</p>
                ) : (
                  <>
                    <div className="mt-4 space-y-2">
                      {DAY_LABELS.map((day, idx) => (
                        <div key={day} className="flex items-center gap-3">
                          <label className="flex w-20 items-center gap-2 text-sm text-foreground">
                            <input type="checkbox" checked={weekDraft[idx].enabled}
                              onChange={(e) => updateDay(idx, { enabled: e.target.checked })}
                              className="rounded border-border" />
                            {day}
                          </label>
                          {weekDraft[idx].enabled ? (
                            <div className="flex items-center gap-2">
                              <input type="time" value={weekDraft[idx].start}
                                onChange={(e) => updateDay(idx, { start: e.target.value })}
                                className="rounded border border-border px-2 py-1 text-sm" />
                              <span className="text-xs text-muted">to</span>
                              <input type="time" value={weekDraft[idx].end}
                                onChange={(e) => updateDay(idx, { end: e.target.value })}
                                className="rounded border border-border px-2 py-1 text-sm" />
                            </div>
                          ) : (
                            <span className="text-sm text-muted">Off</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {availError && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {availError}
                      </div>
                    )}
                    <div className="mt-4">
                      <button onClick={saveAvailability} disabled={availSaving}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:brightness-95 disabled:opacity-50">
                        {availSaving ? "Saving..." : "Save Availability"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
