import Link from "next/link";
import { AlertTriangle, Bell, MessageCircle } from "lucide-react";
import { CoachNotificationsList } from "@/components/coaching/coach-notifications-list";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import type { CoachNotificationsData } from "@/services/coach-service";

export function CoachNotificationsPage({
  data,
}: {
  data: CoachNotificationsData;
}) {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/coach"
          >
            Retour cockpit
          </Link>
        }
        description="Messages non lus, blocages de parcours, corrections et retards à traiter."
        title="Centre de notifications"
      />

      <div className="space-y-6 p-4 sm:p-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Signaux importants regroupés"
            icon={Bell}
            label="Notifications"
            tone="sky"
            value={String(data.metrics.totalCount)}
          />
          <StatCard
            helper="Messages coachés à ouvrir"
            icon={MessageCircle}
            label="Messages non lus"
            tone="indigo"
            value={String(data.metrics.unreadMessagesCount)}
          />
          <StatCard
            helper="Corrections, messages et blocages"
            icon={AlertTriangle}
            label="Priorités hautes"
            tone="rose"
            value={String(data.metrics.highPriorityCount)}
          />
        </section>

        <CoachNotificationsList data={data} />
      </div>
    </>
  );
}
