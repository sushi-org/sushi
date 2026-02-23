import Sidebar from "@/components/sidebar";
import { ToastContainer } from "@/components/toast";
import { BranchProvider } from "@/contexts/branch-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BranchProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <ToastContainer />
    </BranchProvider>
  );
}
