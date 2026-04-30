import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { adminNav } from "@/lib/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user } = await requireRole("admin");

  return (
    <AppShell
      account={{
        email: user.email,
        fullName: profile?.full_name ?? user.email,
        userId: user.id,
      }}
      navItems={adminNav}
      role="admin"
      subtitle="Supervision globale"
    >
      {children}
    </AppShell>
  );
}
