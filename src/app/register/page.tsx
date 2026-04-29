import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Créer un compte | Coaching Platform",
  description: "Créez votre compte Coaching Platform.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      description="Créez un compte coaché pour rejoindre la plateforme et démarrer votre parcours."
      title="Créer un compte"
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
