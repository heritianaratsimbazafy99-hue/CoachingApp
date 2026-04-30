import { requireRole } from "@/lib/auth/session";
import { AdminCohortsPage } from "@/components/coaching/admin-pages";
import { getAdminCohorts, getAdminUsers } from "@/services/admin-service";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erreur serveur inconnue.";
}

export default async function Page() {
  await requireRole("admin");

  const [cohortsResult, usersResult] = await Promise.allSettled([
    getAdminCohorts(),
    getAdminUsers(),
  ]);

  const loadErrors = [
    cohortsResult.status === "rejected"
      ? `Cohortes : ${getErrorMessage(cohortsResult.reason)}`
      : null,
    usersResult.status === "rejected"
      ? `Utilisateurs : ${getErrorMessage(usersResult.reason)}`
      : null,
  ].filter(Boolean);

  return (
    <AdminCohortsPage
      cohorts={cohortsResult.status === "fulfilled" ? cohortsResult.value : []}
      loadError={loadErrors.join(" ")}
      users={usersResult.status === "fulfilled" ? usersResult.value : []}
    />
  );
}
