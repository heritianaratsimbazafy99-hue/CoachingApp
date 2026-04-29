import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Connexion | Coaching Platform",
  description: "Connectez-vous à votre espace Coaching Platform.",
};

export default function LoginPage() {
  return (
    <AuthShell
      description="Connectez-vous avec votre email pour accéder à votre espace admin, coach ou coaché."
      title="Connexion"
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
