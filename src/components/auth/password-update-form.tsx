"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { inputClassName, labelClassName } from "@/components/ui/form-field";
import { getRoleRedirectPath } from "@/lib/auth/roles";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

export function PasswordUpdateForm() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setHasSession(Boolean(session));
      setIsCheckingSession(false);
    });

    async function hydrateSessionFromEmailLink() {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError && isMounted) {
          setError(
            "Le lien est invalide ou expiré. Demandez une nouvelle invitation ou une réinitialisation.",
          );
        } else {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      const { data } = await supabase.auth.getSession();

      if (isMounted) {
        setHasSession(Boolean(data.session));
        setIsCheckingSession(false);
      }
    }

    hydrateSessionFromEmailLink();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!hasSession) {
      setError(
        "Ouvrez le lien reçu par email pour autoriser la définition du mot de passe.",
      );
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess("Mot de passe mis à jour. Redirection vers votre espace...");

      if (data.user) {
        router.replace(getRoleRedirectPath(data.user));
      } else {
        router.replace("/login");
      }

      router.refresh();
    } catch {
      setError("Une erreur inattendue est survenue. Réessayez dans un instant.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {isCheckingSession ? (
        <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          Vérification du lien sécurisé...
        </div>
      ) : null}

      {!isCheckingSession && !hasSession ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Aucun lien actif n&apos;a été détecté. Utilisez le dernier email reçu ou
          demandez un nouveau lien.
        </div>
      ) : null}

      <label className="block">
        <span className={labelClassName}>Nouveau mot de passe</span>
        <input
          autoComplete="new-password"
          className={inputClassName()}
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 caractères"
          required
          type="password"
          value={password}
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Confirmer le mot de passe</span>
        <input
          autoComplete="new-password"
          className={inputClassName()}
          minLength={8}
          name="passwordConfirmation"
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          placeholder="Répétez le mot de passe"
          required
          type="password"
          value={passwordConfirmation}
        />
      </label>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <button
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
        disabled={isLoading || isCheckingSession}
        type="submit"
      >
        <KeyRound className="h-4 w-4" />
        {isLoading ? "Mise à jour..." : "Définir le mot de passe"}
      </button>
    </form>
  );
}
