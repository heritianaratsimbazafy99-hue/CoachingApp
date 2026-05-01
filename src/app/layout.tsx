import type { Metadata } from "next";
import { AppProviders } from "@/components/app/app-providers";
import {
  defaultInterfaceTheme,
  interfaceThemeIds,
  interfaceThemeStorageKey,
} from "@/lib/interface-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coaching Platform",
  description: "Application web de coaching pour admins, coachs et coachés.",
};

const themeInitScript = `
(function () {
  try {
    var key = ${JSON.stringify(interfaceThemeStorageKey)};
    var allowedThemes = ${JSON.stringify(interfaceThemeIds)};
    var storedTheme = window.localStorage.getItem(key);
    var theme = allowedThemes.indexOf(storedTheme) === -1
      ? ${JSON.stringify(defaultInterfaceTheme)}
      : storedTheme;
    document.documentElement.dataset.interfaceTheme = theme;
  } catch (error) {
    document.documentElement.dataset.interfaceTheme = ${JSON.stringify(
      defaultInterfaceTheme,
    )};
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
      data-interface-theme={defaultInterfaceTheme}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
        {children}
        <AppProviders />
      </body>
    </html>
  );
}
