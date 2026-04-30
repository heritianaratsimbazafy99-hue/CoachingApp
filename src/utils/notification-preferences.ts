export type NotificationRole = "coach" | "coachee";

export const coachNotificationPreferenceOptions = [
  { category: "messages", label: "Messages" },
  { category: "paths", label: "Parcours" },
  { category: "corrections", label: "Corrections" },
  { category: "late", label: "Retards" },
  { category: "activity", label: "Activité" },
] as const;

export const coacheeNotificationPreferenceOptions = [
  { category: "messages", label: "Messages" },
  { category: "paths", label: "Parcours" },
  { category: "agenda", label: "Agenda" },
  { category: "results", label: "Résultats" },
] as const;

export type CoachNotificationPreferenceCategory =
  (typeof coachNotificationPreferenceOptions)[number]["category"];

export type CoacheeNotificationPreferenceCategory =
  (typeof coacheeNotificationPreferenceOptions)[number]["category"];

export const notificationPreferenceStorageKeys = {
  coach: "coaching-platform:coach-notification-categories",
  coachee: "coaching-platform:coachee-notification-categories",
} satisfies Record<NotificationRole, string>;

export const notificationPreferencesChangedEvent =
  "coaching-platform:notification-preferences-change";

export function getStoredNotificationPreferenceSnapshot(storageKey: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(storageKey) ?? "";
}

export function subscribeToNotificationPreferenceChanges(
  onStoreChange: () => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(notificationPreferencesChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(
      notificationPreferencesChangedEvent,
      onStoreChange,
    );
  };
}

export function normalizeNotificationPreferenceSelection<Category extends string>(
  selected: unknown,
  availableCategories: readonly Category[],
): Category[] {
  const available = new Set<string>(availableCategories);

  if (!Array.isArray(selected)) {
    return [...availableCategories];
  }

  const filtered = selected.filter(
    (value): value is Category =>
      typeof value === "string" && available.has(value),
  );

  return filtered.length ? filtered : [...availableCategories];
}
