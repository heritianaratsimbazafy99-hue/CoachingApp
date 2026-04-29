import { AppShell } from "@/components/app/app-shell";
import { adminNav, coachNav, coacheeNav } from "@/lib/navigation";

export function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={coachNav} role="coach" subtitle="Cockpit coach">
      {children}
    </AppShell>
  );
}

export function CoacheeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={coacheeNav} role="coachee" subtitle="Espace coaché">
      {children}
    </AppShell>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={adminNav} role="admin" subtitle="Supervision globale">
      {children}
    </AppShell>
  );
}
