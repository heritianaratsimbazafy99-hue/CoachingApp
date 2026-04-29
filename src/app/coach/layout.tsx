import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { coachNav } from "@/lib/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user, role } = await requireRole(["admin", "coach"]);

  return (
    <AppShell
      account={{
        email: user.email,
        fullName: profile?.full_name ?? user.email,
      }}
      navItems={coachNav}
      role={role === "admin" ? "coach" : role}
      subtitle="Cockpit coach"
    >
      {children}
    </AppShell>
  );
}
