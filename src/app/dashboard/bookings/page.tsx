"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  staff_name: string;
  service_name: string;
  customer_name: string | null;
  customer_phone: string;
  price: string;
  currency: string;
  status: string;
  booked_via: string;
  notes: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-50 text-green-700",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-amber-50 text-amber-700",
};

export default function BookingsPage() {
  const { data: session } = useSession();
  const { selectedBranchId } = useBranch();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const companyId = session?.companyId;

  useEffect(() => {
    if (!companyId) return;

    async function load() {
      try {
        const params = selectedBranchId ? `?branch_id=${selectedBranchId}` : "";
        const data = await api<Booking[]>(
          `/companies/${companyId}/bookings${params}`,
        );
        setBookings(data);
      } catch {
        // API not ready
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    load();
  }, [companyId, selectedBranchId]);

  const filtered =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-muted">
            All bookings for your company.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["all", "confirmed", "completed", "cancelled", "no_show"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-primary text-primary-ink"
                  : "border border-border bg-white text-muted hover:bg-surface"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20">
          <svg
            viewBox="0 0 24 24"
            className="h-12 w-12 text-border"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 3v4M17 3v4M3 10h18" />
          </svg>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            No bookings yet
          </h2>
          <p className="mt-1 max-w-sm text-center text-sm text-muted">
            Bookings created via the AI agent or manually will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-border bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted">Date</th>
                  <th className="px-4 py-3 font-medium text-muted">Time</th>
                  <th className="px-4 py-3 font-medium text-muted">Staff</th>
                  <th className="px-4 py-3 font-medium text-muted">Service</th>
                  <th className="px-4 py-3 font-medium text-muted">Customer</th>
                  <th className="px-4 py-3 font-medium text-muted">Phone</th>
                  <th className="px-4 py-3 font-medium text-muted">Price</th>
                  <th className="px-4 py-3 font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-surface/30">
                    <td className="px-4 py-3 text-foreground">{b.date}</td>
                    <td className="px-4 py-3 text-foreground">
                      {b.start_time}–{b.end_time}
                    </td>
                    <td className="px-4 py-3 text-foreground">{b.staff_name}</td>
                    <td className="px-4 py-3 text-foreground">
                      {b.service_name}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {b.customer_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{b.customer_phone}</td>
                    <td className="px-4 py-3 text-foreground">
                      {b.currency} {b.price}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? "bg-gray-50 text-gray-700"}`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: cards */}
          <div className="mt-6 space-y-3 md:hidden">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="font-medium text-foreground">
                  {b.service_name} · {b.staff_name}
                </div>
                <div className="mt-0.5 text-sm text-muted">
                  {b.date} · {b.start_time}–{b.end_time}
                </div>
                <div className="mt-0.5 text-sm text-foreground">
                  {b.customer_name || "—"} · {b.customer_phone}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {b.currency} {b.price}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? "bg-gray-50 text-gray-700"}`}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
