"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useBranch } from "@/contexts/branch-context";

const BRANCH_NAV = [
  {
    label: "Home",
    href: "/dashboard/home",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10.5z" />
      </svg>
    ),
  },
  {
    label: "Inbox",
    href: "/dashboard/inbox",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16v14H4z" />
        <path d="M4 5l8 7 8-7" />
      </svg>
    ),
  },
  {
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { companyName, branches, selectedBranchId, setSelectedBranchId } = useBranch();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-white">
      {/* Logo + Company */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" fill="none">
            <rect width="32" height="32" rx="8" fill="#eef5fb" stroke="#bdd5e6" strokeWidth="1" />
            <path d="M10 22V14l6-4 6 4v8" stroke="#1c6b96" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="13.5" y="17" width="5" height="5" rx="0.5" stroke="#1c6b96" strokeWidth="1.4" fill="none" />
          </svg>
          <span className="text-base font-semibold tracking-tight text-foreground">
            Clink
          </span>
        </div>
        {companyName && (
          <p className="mt-2 truncate text-sm font-medium text-foreground/70">
            {companyName}
          </p>
        )}
      </div>

      {/* Branch selector */}
      {branches.length > 0 && (
        <div className="mx-5 mt-4 mb-2 rounded-lg border border-border bg-surface/50 px-3 py-2.5">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted">
            Branch
          </label>
          <select
            value={selectedBranchId ?? ""}
            onChange={(e) => setSelectedBranchId(e.target.value || null)}
            className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Branch-scoped navigation */}
      <nav className="flex-1 space-y-0.5 px-3 pt-3">
        {BRANCH_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[#eef5fb] text-primary"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-3! border-t border-border" />

        {/* Settings (company-level) */}
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname.startsWith("/dashboard/settings")
              ? "bg-[#eef5fb] text-primary"
              : "text-muted hover:bg-surface hover:text-foreground"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          Settings
        </Link>
      </nav>

      {/* User footer */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt=""
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">
              {session?.user?.name?.[0] ?? "?"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {session?.user?.name}
            </p>
            <p className="truncate text-xs text-muted">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-3 w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
