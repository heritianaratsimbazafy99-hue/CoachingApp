import type { Metadata } from "next";
import { AppProviders } from "@/components/app/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coaching Platform",
  description: "Application web de coaching pour admins, coachs et coachés.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <AppProviders />
      </body>
    </html>
  );
}
