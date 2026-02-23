"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SETTINGS_NAV = [
  { label: "Company", href: "/dashboard/settings/company" },
  { label: "Members", href: "/dashboard/settings/members" },
  { label: "Branches", href: "/dashboard/settings/branches" },
  { label: "Services", href: "/dashboard/settings/services" },
  { label: "Staff", href: "/dashboard/settings/staff" },
  { label: "FAQs", href: "/dashboard/settings/faqs" },
  { label: "WhatsApp", href: "/dashboard/settings/whatsapp" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted">
        Configure your company, services, and integrations.
      </p>

      <nav className="mt-6 flex gap-1 border-b border-border">
        {SETTINGS_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:border-border hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
