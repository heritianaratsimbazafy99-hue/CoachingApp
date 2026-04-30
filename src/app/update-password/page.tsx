import type { Metadata } from "next";
import { PasswordUpdateForm } from "@/components/auth/password-update-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Définir le mot de passe | Coaching Platform",
  description:
    "Définissez un nouveau mot de passe après une invitation ou une réinitialisation.",
};

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      description="Choisissez un mot de passe sécurisé depuis le lien reçu par email."
      title="Définir le mot de passe"
    >
      <PasswordUpdateForm />
    </AuthShell>
  );
}
