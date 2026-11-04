import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ACCOUNT = ["/compte/connexion", "/compte/inscription", "/compte/mot-de-passe"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const needsAuth = (path.startsWith("/compte") && !PUBLIC_ACCOUNT.some((p) => path.startsWith(p))) || path.startsWith("/admin");
  if (needsAuth && !user) {
    const login = req.nextUrl.clone();
    login.pathname = "/compte/connexion";
    login.search = `?redirect=${encodeURIComponent(path)}`;
    return NextResponse.redirect(login);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico|icon.svg|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|webp|avif)$).*)"],
};
