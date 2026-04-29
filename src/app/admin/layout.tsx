import { AdminLayout } from "@/components/app/role-layouts";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
