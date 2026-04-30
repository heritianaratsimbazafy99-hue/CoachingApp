import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { coacheeNav } from "@/lib/navigation";
import { getCoacheeShellSignals } from "@/services/app-shell-service";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user, role } = await requireRole(["admin", "coachee"]);
  const signals = await getCoacheeShellSignals(user.id);

  return (
    <AppShell
      account={{
        email: user.email,
        fullName: profile?.full_name ?? user.email,
      }}
      navItems={coacheeNav}
      role={role === "admin" ? "coachee" : role}
      signals={signals}
      subtitle="Espace coaché"
    >
      {children}
    </AppShell>
  );
}
