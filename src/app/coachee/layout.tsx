import { AppShell } from "@/components/app/app-shell";
import { requireRole } from "@/lib/auth/session";
import { coacheeNav } from "@/lib/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user, role } = await requireRole(["admin", "coachee"]);

  return (
    <AppShell
      account={{
        email: user.email,
        fullName: profile?.full_name ?? user.email,
      }}
      navItems={coacheeNav}
      role={role === "admin" ? "coachee" : role}
      subtitle="Espace coaché"
    >
      {children}
    </AppShell>
  );
}
