export const interfaceThemeStorageKey =
  "coaching-platform-interface-theme";

export const defaultInterfaceTheme = "violet";

export const interfaceThemes = [
  {
    description: "Fond violet pastel, sidebar lavande et accent jaune clair.",
    id: "violet",
    label: "Lavande",
    swatches: ["#fbf7ff", "#756098", "#fff0b8"],
  },
  {
    description: "Bleu clair, sidebar océan et accents menthe.",
    id: "ocean",
    label: "Océan",
    swatches: ["#f2fbff", "#0f4e68", "#dff7f2"],
  },
  {
    description: "Vert doux, sidebar sauge et accent pêche.",
    id: "sage",
    label: "Sauge",
    swatches: ["#f5fbf6", "#28594f", "#ffe5c4"],
  },
  {
    description: "Fond clair froid, sidebar nuit et accent lavande.",
    id: "midnight",
    label: "Nuit",
    swatches: ["#f4f7fb", "#111827", "#e0e7ff"],
  },
] as const;

export type InterfaceThemeId = (typeof interfaceThemes)[number]["id"];

export const interfaceThemeIds = interfaceThemes.map((theme) => theme.id);

export function isInterfaceThemeId(
  value: string | null,
): value is InterfaceThemeId {
  return interfaceThemeIds.includes(value as InterfaceThemeId);
}
