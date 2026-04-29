import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getDashboardPath, getUserRole, type UserRole } from "@/lib/auth/roles";

const authRoutes = new Set(["/login", "/register", "/forgot-password"]);

const protectedRouteRoles: Array<{
  prefix: string;
  roles: UserRole[];
}> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/coach", roles: ["admin", "coach"] },
  { prefix: "/coachee", roles: ["admin", "coachee"] },
];

type CookieUpdate = {
  name: string;
  options: CookieOptions;
  value: string;
};

function matchingProtectedRoute(pathname: string) {
  return protectedRouteRoles.find(
    (route) =>
      pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  const cookieUpdates: CookieUpdate[] = [];
  const headerUpdates: Record<string, string> = {};
  let response = NextResponse.next({ request });

  function applySupabaseUpdates(target: NextResponse) {
    cookieUpdates.forEach(({ name, value, options }) => {
      target.cookies.set(name, value, options);
    });

    Object.entries(headerUpdates).forEach(([key, value]) => {
      target.headers.set(key, value);
    });

    return target;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookieUpdates.push(...cookiesToSet);
        Object.assign(headerUpdates, headers);

        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = applySupabaseUpdates(NextResponse.next({ request }));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const protectedRoute = matchingProtectedRoute(pathname);

  if (protectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);

    return applySupabaseUpdates(NextResponse.redirect(redirectUrl));
  }

  if (!user) {
    return response;
  }

  const role = getUserRole(user);

  if (authRoutes.has(pathname)) {
    return applySupabaseUpdates(
      NextResponse.redirect(new URL(getDashboardPath(role), request.url)),
    );
  }

  if (protectedRoute && !protectedRoute.roles.includes(role)) {
    return applySupabaseUpdates(
      NextResponse.redirect(new URL(getDashboardPath(role), request.url)),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
