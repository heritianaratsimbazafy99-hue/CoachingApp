import Link from "next/link";
import { AlertTriangle, Bell, MessageCircle } from "lucide-react";
import { CoacheeNotificationsList } from "@/components/coaching/coachee-notifications-list";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import type { CoacheeNotificationsData } from "@/services/coachee-service";

export function CoacheeNotificationsPage({
  data,
}: {
  data: CoacheeNotificationsData;
}) {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className="rounded-lg border border-indigo-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-indigo-900/5 transition hover:bg-indigo-50 hover:text-indigo-700"
            href="/coachee"
          >
            Retour accueil
          </Link>
        }
        description="Messages, prochains rendez-vous, parcours à reprendre et résultats récents."
        title="Notifications"
      />

      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Signaux récents"
            icon={Bell}
            label="Notifications"
            tone="indigo"
            value={String(data.metrics.totalCount)}
          />
          <StatCard
            helper="Messages à ouvrir"
            icon={MessageCircle}
            label="Messages non lus"
            tone="sky"
            value={String(data.metrics.unreadMessagesCount)}
          />
          <StatCard
            helper="À traiter bientôt"
            icon={AlertTriangle}
            label="Priorités"
            tone="rose"
            value={String(data.metrics.highPriorityCount)}
          />
        </section>

        <CoacheeNotificationsList data={data} />
      </div>
    </>
  );
}
