import DashboardShell from "@/components/dashboard-shell";
import { ToastContainer } from "@/components/toast";
import { BranchProvider } from "@/contexts/branch-context";
import { SidebarProvider } from "@/contexts/sidebar-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BranchProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <DashboardShell>{children}</DashboardShell>
        </div>
        <ToastContainer />
      </SidebarProvider>
    </BranchProvider>
  );
}
