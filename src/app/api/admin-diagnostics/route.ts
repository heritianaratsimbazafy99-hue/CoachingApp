import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth/roles";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DiagnosticCheck = {
  message: string;
  name: string;
  ok: boolean;
};

function envStatus(name: string) {
  return Boolean(process.env[name]);
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Erreur inconnue.";
}

async function runCheck(
  name: string,
  task: () => Promise<void>,
): Promise<DiagnosticCheck> {
  try {
    await task();

    return {
      message: "OK",
      name,
      ok: true,
    };
  } catch (error) {
    return {
      message: errorMessage(error),
      name,
      ok: false,
    };
  }
}

function assertNoSupabaseError(error: { message?: string } | null) {
  if (error) {
    throw new Error(error.message ?? "Erreur Supabase.");
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: userError?.message ?? "Session absente.",
          ok: false,
        },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle<{ role: string | null }>();
    const role = getUserRole(user, profile?.role);

    if (role !== "admin") {
      return NextResponse.json(
        {
          error: "Compte connecté non admin.",
          ok: false,
          role,
        },
        { status: 403 },
      );
    }

    const checks: DiagnosticCheck[] = [];

    checks.push(
      await runCheck("Service role Supabase", async () => {
        createServiceSupabaseClient();
      }),
    );

    if (checks.at(-1)?.ok) {
      const adminSupabase = createServiceSupabaseClient();

      checks.push(
        await runCheck("Auth Admin listUsers", async () => {
          const { error } = await adminSupabase.auth.admin.listUsers({
            page: 1,
            perPage: 1,
          });

          assertNoSupabaseError(error);
        }),
        await runCheck("Table profiles", async () => {
          const { error } = await adminSupabase
            .from("profiles")
            .select("id", { count: "exact", head: true });

          assertNoSupabaseError(error);
        }),
        await runCheck("Table cohorts", async () => {
          const { error } = await adminSupabase
            .from("cohorts")
            .select("id", { count: "exact", head: true });

          assertNoSupabaseError(error);
        }),
        await runCheck("Table cohort_members", async () => {
          const { error } = await adminSupabase
            .from("cohort_members")
            .select("id", { count: "exact", head: true });

          assertNoSupabaseError(error);
        }),
        await runCheck("Table assignment_progress", async () => {
          const { error } = await adminSupabase
            .from("assignment_progress")
            .select("id", { count: "exact", head: true });

          assertNoSupabaseError(error);
        }),
        await runCheck("Table email_logs", async () => {
          const { error } = await adminSupabase
            .from("email_logs")
            .select("id", { count: "exact", head: true });

          assertNoSupabaseError(error);
        }),
      );
    }

    return NextResponse.json({
      checks,
      env: {
        cronSecret: envStatus("CRON_SECRET"),
        nextPublicSupabaseAnonKey: envStatus("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        nextPublicSupabaseUrl: envStatus("NEXT_PUBLIC_SUPABASE_URL"),
        resendApiKey: envStatus("RESEND_API_KEY"),
        supabaseServiceRoleKey: envStatus("SUPABASE_SERVICE_ROLE_KEY"),
        transactionalEmailFrom: envStatus("TRANSACTIONAL_EMAIL_FROM"),
      },
      ok: checks.every((check) => check.ok),
      role,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: errorMessage(error),
        ok: false,
      },
      { status: 500 },
    );
  }
}
