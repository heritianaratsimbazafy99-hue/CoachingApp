export type ReminderTemplateUsage =
  | "general"
  | "path_blocked"
  | "path_correction";

const usagePrefixes: Record<Exclude<ReminderTemplateUsage, "general">, string> = {
  path_blocked: "[path:blocked] ",
  path_correction: "[path:correction] ",
};

export const reminderTemplateUsageLabels: Record<ReminderTemplateUsage, string> = {
  general: "Général",
  path_blocked: "Parcours bloqué",
  path_correction: "Correction parcours",
};

export function parseReminderTemplateTitle(title: string): {
  title: string;
  usage: ReminderTemplateUsage;
} {
  const pathUsage = Object.entries(usagePrefixes).find(([, prefix]) =>
    title.startsWith(prefix),
  ) as [Exclude<ReminderTemplateUsage, "general">, string] | undefined;

  if (!pathUsage) {
    return {
      title,
      usage: "general",
    };
  }

  const [usage, prefix] = pathUsage;

  return {
    title: title.slice(prefix.length),
    usage,
  };
}

export function encodeReminderTemplateTitle(
  title: string,
  usage: ReminderTemplateUsage,
) {
  const cleanTitle = parseReminderTemplateTitle(title).title.trim();

  if (usage === "general") {
    return cleanTitle;
  }

  return `${usagePrefixes[usage]}${cleanTitle}`;
}

export function renderReminderTemplateBody(
  body: string,
  variables: Record<string, string>,
) {
  return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const value = variables[key.toLowerCase()];

    return value ?? match;
  });
}
