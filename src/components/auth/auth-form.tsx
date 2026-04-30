"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  getRoleRedirectPath,
  getUserRole,
  type UserRole,
} from "@/lib/auth/roles";
import { buttonVariants } from "@/components/ui/button";
import { inputClassName, labelClassName } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

type AuthMode = "forgot-password" | "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

const buttonLabel: Record<AuthMode, string> = {
  "forgot-password": "Envoyer le lien",
  login: "Se connecter",
  register: "Créer le compte",
};

const loadingLabel: Record<AuthMode, string> = {
  "forgot-password": "Envoi en cours...",
  login: "Connexion...",
  register: "Création du compte...",
};

function isAuthorizedRedirect(path: string, role: UserRole) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  if (path.startsWith("/admin")) {
    return role === "admin";
  }

  if (path.startsWith("/coach")) {
    return role === "admin" || role === "coach";
  }

  if (path.startsWith("/coachee")) {
    return role === "admin" || role === "coachee";
  }

  return false;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot-password";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (loginError) {
          setError(loginError.message);
          return;
        }

        if (data.user) {
          const role = getUserRole(data.user);
          const nextPath = new URLSearchParams(window.location.search).get(
            "next",
          );

          router.replace(
            nextPath && isAuthorizedRedirect(nextPath, role)
              ? nextPath
              : getRoleRedirectPath(data.user),
          );
          router.refresh();
        }

        return;
      }

      if (isRegister) {
        const { data, error: registerError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "coachee",
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (registerError) {
          setError(registerError.message);
          return;
        }

        if (data.session && data.user) {
          router.replace(getRoleRedirectPath(data.user));
          router.refresh();
          return;
        }

        setSuccess(
          "Compte créé. Vérifiez votre email pour confirmer votre inscription.",
        );
        return;
      }

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(
        "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
      );
    } catch {
      setError("Une erreur inattendue est survenue. Réessayez dans un instant.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {isRegister ? (
        <label className="block">
          <span className={labelClassName}>Nom complet</span>
          <input
            className={inputClassName()}
            name="fullName"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Marie Rakoto"
            required
            type="text"
            value={fullName}
          />
        </label>
      ) : null}

      <label className="block">
        <span className={labelClassName}>Email</span>
        <input
          autoComplete="email"
          className={inputClassName()}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="vous@exemple.com"
          required
          type="email"
          value={email}
        />
      </label>

      {isForgotPassword ? null : (
        <label className="block">
          <span className={labelClassName}>Mot de passe</span>
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={inputClassName()}
            minLength={6}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 caractères"
            required
            type="password"
            value={password}
          />
        </label>
      )}

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
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? loadingLabel[mode] : buttonLabel[mode]}
      </button>

      <div className="space-y-3 text-center text-sm text-slate-600">
        {isLogin ? (
          <>
            <Link
              className="font-medium text-sky-700 hover:underline"
              href="/forgot-password"
            >
              Mot de passe oublié ?
            </Link>
            <p>
              Pas encore de compte ?{" "}
              <Link
                className="font-medium text-sky-700 hover:underline"
                href="/register"
              >
                Créer un compte
              </Link>
            </p>
          </>
        ) : null}

        {isRegister ? (
          <p>
            Déjà un compte ?{" "}
            <Link
              className="font-medium text-sky-700 hover:underline"
              href="/login"
            >
              Se connecter
            </Link>
          </p>
        ) : null}

        {isForgotPassword ? (
          <p>
            Vous vous souvenez du mot de passe ?{" "}
            <Link
              className="font-medium text-sky-700 hover:underline"
              href="/login"
            >
              Retour a la connexion
            </Link>
          </p>
        ) : null}
      </div>
    </form>
  );
}
