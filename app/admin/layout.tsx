import AdminShell from "@/components/admin/AdminShell";

// ============================================================
// LAYOUT ADMIN — protegge TUTTO /admin/**
// ============================================================
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
