"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard/home": "Home",
  "/dashboard/inbox": "Inbox",
  "/dashboard/bookings": "Bookings",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/company": "Company",
  "/dashboard/settings/members": "Members",
  "/dashboard/settings/branches": "Branches",
  "/dashboard/settings/services": "Services",
  "/dashboard/settings/staff": "Staff",
  "/dashboard/settings/faqs": "FAQs",
  "/dashboard/settings/whatsapp": "WhatsApp",
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return title;
    }
  }
  return "Dashboard";
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, closeSidebar } = useSidebar();
  const pageTitle = getPageTitle(pathname);

  return (
    <>
      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center border-b border-border bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
          aria-label="Open menu"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h1 className="ml-2 flex-1 truncate text-base font-semibold text-foreground">
          {pageTitle}
        </h1>
      </header>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={closeSidebar}
          onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
    </>
  );
}
