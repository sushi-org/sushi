import { ToastContainer } from "@/components/toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {children}
      </div>
      <ToastContainer />
    </div>
  );
}
