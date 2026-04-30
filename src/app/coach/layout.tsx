import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { coachNav } from "@/lib/navigation";
import { getCoachShellSignals } from "@/services/app-shell-service";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user, role } = await requireRole(["admin", "coach"]);
  const signals = await getCoachShellSignals(user.id);

  return (
    <AppShell
      account={{
        email: user.email,
        fullName: profile?.full_name ?? user.email,
        userId: user.id,
      }}
      navItems={coachNav}
      role={role === "admin" ? "coach" : role}
      signals={signals}
      subtitle="Cockpit coach"
    >
      {children}
    </AppShell>
  );
}
