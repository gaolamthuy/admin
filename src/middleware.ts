import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Handle root: send anonymous to signin, authenticated to role home
  if (request.nextUrl.pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    const { data: userRole } = await supabase
      .from("glt_users")
      .select("role")
      .eq("user_id", session.user.id)
      .single();
    if (userRole?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (userRole?.role === "staff") {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    // Default fallback when user has no role row yet
    return NextResponse.redirect(new URL("/staff/dashboard", request.url));
  }

  // If authenticated and on auth pages, redirect to role home
  if (
    session &&
    (request.nextUrl.pathname === "/auth" ||
      request.nextUrl.pathname === "/auth/" ||
      request.nextUrl.pathname === "/auth/signin")
  ) {
    const { data: userRole } = await supabase
      .from("glt_users")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (userRole?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (userRole?.role === "staff") {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    // Default fallback when user has no role row yet
    return NextResponse.redirect(new URL("/staff/dashboard", request.url));
  }

  // Redirect to signin if not authenticated and trying to access protected routes
  if (
    !session &&
    (request.nextUrl.pathname === "/admin" ||
      request.nextUrl.pathname === "/admin/" ||
      request.nextUrl.pathname.startsWith("/admin/") ||
      request.nextUrl.pathname === "/staff" ||
      request.nextUrl.pathname === "/staff/" ||
      request.nextUrl.pathname.startsWith("/staff/"))
  ) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Get user role and redirect accordingly
  if (session) {
    const { data: userRole } = await supabase
      .from("glt_users")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (
      userRole?.role === "admin" &&
      request.nextUrl.pathname.startsWith("/staff")
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (
      userRole?.role === "staff" &&
      request.nextUrl.pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
