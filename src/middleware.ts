import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/compte", "/espace-porteur", "/admin"];

/** Rafraîchit la session Supabase et protège les espaces privés. */
export async function middleware(request: NextRequest) {
  // Supabase renvoie les liens e-mail refusés sur l'accueil avec ?error_code=… :
  // on affiche une page claire à la place.
  const errorCode = request.nextUrl.searchParams.get("error_code");
  if (errorCode && request.nextUrl.pathname === "/") {
    const target = new URL("/auth/erreur", request.url);
    target.searchParams.set("raison", errorCode === "otp_expired" ? "expire" : "lien");
    return NextResponse.redirect(target);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isProtected = PROTECTED.some((p) => request.nextUrl.pathname.startsWith(p));
  const toLogin = () => {
    const login = new URL("/connexion", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  };

  if (!url || !key) return isProtected ? toLogin() : NextResponse.next();
  // Visiteur sans session : rien à rafraîchir, on évite un appel réseau à chaque page.
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasSession) return isProtected ? toLogin() : NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && isProtected) return toLogin();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
