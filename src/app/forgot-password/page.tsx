import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Mot de passe oublié | Coaching Platform",
  description: "Recevez un lien de réinitialisation de mot de passe.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Indiquez votre email et Supabase vous enverra un lien de réinitialisation si le compte existe."
      title="Mot de passe oublié"
    >
      <AuthForm mode="forgot-password" />
    </AuthShell>
  );
}
