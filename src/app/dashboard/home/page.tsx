"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Custom tooltip props (Recharts injects these at runtime)
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string | number;
}

// ── Types ────────────────────────────────────────────────────────────────

interface Analytics {
  conversations: {
    total: number;
    resolved_by_ai: number;
    resolved_by_human: number;
    escalated: number;
    active: number;
    ai_resolution_rate: number;
  };
  bookings: {
    total: number;
    by_ai: number;
    by_human: number;
    ai_booking_rate: number;
    upcoming_today: number;
  };
  revenue: {
    total: number;
    from_ai: number;
    from_human: number;
    currency: string;
  };
  messages: {
    total: number;
    from_ai: number;
    from_customers: number;
    from_humans: number;
  };
  booking_trend: { date: string; total: number; by_ai: number; by_human: number }[];
  revenue_trend: { date: string; total: number; from_ai: number; from_human: number }[];
  conversion_rate: number;
  conversations_with_bookings: number;
}

// ── Formatting helpers ───────────────────────────────────────────────────

function fmtCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function fmtShortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Ring chart (SVG) ─────────────────────────────────────────────────────

function RingProgress({
  value,
  size = 140,
  strokeWidth = 12,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{value}%</span>
      </div>
    </div>
  );
}

// ── Split bar ────────────────────────────────────────────────────────────

function SplitBar({
  aiValue,
  humanValue,
  className = "",
}: {
  aiValue: number;
  humanValue: number;
  className?: string;
}) {
  const total = aiValue + humanValue;
  const aiPct = total > 0 ? (aiValue / total) * 100 : 0;

  return (
    <div
      className={`flex h-2 w-full overflow-hidden rounded-full bg-surface ${className}`}
    >
      <div
        className="rounded-full bg-primary transition-all duration-500"
        style={{ width: `${aiPct}%` }}
      />
    </div>
  );
}

// ── Chart tooltips ───────────────────────────────────────────────────────

function BookingTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const ai = payload.find((p) => p.dataKey === "by_ai")?.value ?? 0;
  const human = payload.find((p) => p.dataKey === "by_human")?.value ?? 0;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{fmtShortDate(String(label ?? ""))}</p>
      <p className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
        {ai} by AI
      </p>
      <p className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-[#d3e0ea]" />
        {human} by team
      </p>
    </div>
  );
}

function RevenueTooltip({
  active,
  payload,
  label,
  currency,
}: ChartTooltipProps & { currency: string }) {
  if (!active || !payload?.length) return null;
  const ai = payload.find((p) => p.dataKey === "from_ai")?.value ?? 0;
  const human = payload.find((p) => p.dataKey === "from_human")?.value ?? 0;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{fmtShortDate(String(label ?? ""))}</p>
      <p className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
        {fmtCurrency(ai, currency)} from AI
      </p>
      <p className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-[#d3e0ea]" />
        {fmtCurrency(human, currency)} from team
      </p>
    </div>
  );
}

// ── Chart legend ─────────────────────────────────────────────────────────

function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
        AI Agent
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-[#d3e0ea]" />
        Your Team
      </span>
    </div>
  );
}

// ── Skeleton loader ──────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-border bg-surface ${className}`}
    />
  );
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a7 7 0 017 7c0 3-2 5.5-4 7l-3 3.5L9 16c-2-1.5-4-4-4-7a7 7 0 017-7z" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        No activity yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Once your AI agent starts handling conversations and bookings,
        you&apos;ll see its performance here.
      </p>
    </div>
  );
}

// ── Stat pill ────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-foreground">
        {fmtNumber(value)}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: session } = useSession();
  const { selectedBranchId } = useBranch();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const companyId = session?.companyId;

  useEffect(() => {
    if (!companyId) return;

    async function load() {
      try {
        const params = selectedBranchId
          ? `?branch_id=${selectedBranchId}`
          : "";
        const data = await api<Analytics>(
          `/companies/${companyId}/analytics/home${params}`,
        );
        setAnalytics(data);
      } catch {
        // API not available yet
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    load();
  }, [companyId, selectedBranchId]);

  const hasData =
    analytics &&
    (analytics.conversations.total > 0 || analytics.bookings.total > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Home
      </h1>
      <p className="mt-1 text-sm text-muted">
        See how your AI agent is performing.
      </p>

      {loading ? (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-48" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </div>
      ) : !hasData ? (
        <EmptyState />
      ) : (
        analytics && (
          <>
            {/* ── Hero: AI Resolution Rate ─────────────────────────── */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex flex-col items-center gap-6 p-4 sm:flex-row sm:gap-8 sm:p-6 lg:p-8">
                <RingProgress value={analytics.conversations.ai_resolution_rate} />

                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    AI Agent Performance
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                    {analytics.conversations.ai_resolution_rate}% of
                    conversations handled by AI
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Your AI agent resolved{" "}
                    <span className="font-semibold text-foreground">
                      {fmtNumber(analytics.conversations.resolved_by_ai)}
                    </span>{" "}
                    conversations without needing a human.{" "}
                    <span className="font-semibold text-foreground">
                      {fmtNumber(
                        analytics.conversations.resolved_by_human +
                          analytics.conversations.escalated,
                      )}
                    </span>{" "}
                    needed your team.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 sm:flex-col sm:justify-start">
                  <StatPill
                    label="Resolved by AI"
                    value={analytics.conversations.resolved_by_ai}
                    color="bg-primary"
                  />
                  <Link
                    href={
                      selectedBranchId
                        ? `/dashboard/inbox?needed_human=true&branch_id=${selectedBranchId}`
                        : "/dashboard/inbox?needed_human=true"
                    }
                    className="block cursor-pointer transition hover:opacity-80"
                  >
                    <StatPill
                      label="Needed a human"
                      value={
                        analytics.conversations.resolved_by_human +
                        analytics.conversations.escalated
                      }
                      color="bg-amber-500"
                    />
                  </Link>
                  <StatPill
                    label="Active now"
                    value={analytics.conversations.active}
                    color="bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* ── Key metrics row ─────────────────────────────────── */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* Conversion rate */}
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Conversion Rate
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {analytics.conversion_rate}%
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(analytics.conversion_rate, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  <span className="font-medium text-foreground">
                    {fmtNumber(analytics.conversations_with_bookings)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {fmtNumber(analytics.conversations.total)}
                  </span>{" "}
                  conversations led to a booking
                </p>
              </div>

              {/* Bookings with source split */}
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Bookings
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {fmtNumber(analytics.bookings.total)}
                </p>
                <SplitBar
                  aiValue={analytics.bookings.by_ai}
                  humanValue={analytics.bookings.by_human}
                  className="mt-3"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    {fmtNumber(analytics.bookings.by_ai)} by AI (
                    {analytics.bookings.ai_booking_rate}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-surface" />
                    {fmtNumber(analytics.bookings.by_human)} by team
                  </span>
                </div>
              </div>

              {/* Revenue with source split */}
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Revenue
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {fmtCurrency(analytics.revenue.total, analytics.revenue.currency)}
                </p>
                <SplitBar
                  aiValue={analytics.revenue.from_ai}
                  humanValue={analytics.revenue.from_human}
                  className="mt-3"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    {fmtCurrency(analytics.revenue.from_ai, analytics.revenue.currency)}{" "}
                    from AI
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-surface" />
                    {fmtCurrency(analytics.revenue.from_human, analytics.revenue.currency)}{" "}
                    from team
                  </span>
                </div>
              </div>
            </div>

            {/* ── Trend charts + Messages card ───────────────────── */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* Booking volume trend */}
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Booking Volume
                    </p>
                    <p className="text-xs text-muted">Last 30 days</p>
                  </div>
                  <ChartLegend />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.booking_trend}>
                    <defs>
                      <linearGradient id="bookAiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="bookHumanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d3e0ea" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#d3e0ea" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtShortDate}
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                      interval={6}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<BookingTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="by_human"
                      stackId="1"
                      stroke="#d3e0ea"
                      strokeWidth={2}
                      fill="url(#bookHumanGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="by_ai"
                      stackId="1"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#bookAiGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue trend */}
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Revenue
                    </p>
                    <p className="text-xs text-muted">Last 30 days</p>
                  </div>
                  <ChartLegend />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={analytics.revenue_trend}>
                    <defs>
                      <linearGradient id="revAiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="revHumanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d3e0ea" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#d3e0ea" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtShortDate}
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                      interval={6}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                      }
                    />
                    <Tooltip
                      content={
                        <RevenueTooltip
                          currency={analytics.revenue.currency}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="from_human"
                      stackId="1"
                      stroke="#d3e0ea"
                      strokeWidth={2}
                      fill="url(#revHumanGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="from_ai"
                      stackId="1"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#revAiGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Messages card */}
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Messages
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {fmtNumber(analytics.messages.from_ai)}
                </p>
                <p className="mt-1 text-xs text-muted">AI messages sent</p>
                <div className="mt-4 space-y-2 text-sm text-muted">
                  <div className="flex justify-between">
                    <span>From customers</span>
                    <span className="font-medium text-foreground">
                      {fmtNumber(analytics.messages.from_customers)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>From your team</span>
                    <span className="font-medium text-foreground">
                      {fmtNumber(analytics.messages.from_humans)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-medium text-foreground">
                      {fmtNumber(analytics.messages.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
