import { NextResponse, type NextRequest } from "next/server";
import { isDeferredRoute } from "@/shared/lib/features";
import { isReal } from "@/shared/api/client";

/*
 * Защита маршрутов по роли (Next 16: бывший middleware).
 * Только скрывает и редиректит — окончательно права проверяет Django.
 *
 * Роль берём из payload JWT в httpOnly-cookie `access` (без проверки подписи — это
 * лишь подсказка для роутинга). Пока вход не идёт через Django (моки) — из cookie `cts_mock_role`.
 */

type Role = { authed: boolean; player: boolean; organizer: boolean; admin: boolean; verified: boolean };

const MOCK_SESSION = !isReal("auth");

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function readRole(req: NextRequest): Role {
  if (MOCK_SESSION) {
    const r = req.cookies.get("cts_mock_role")?.value ?? "organizer";
    return {
      authed: r !== "guest",
      player: r !== "guest",
      organizer: r === "organizer",
      admin: false,
      verified: true,
    };
  }
  const token = req.cookies.get("access")?.value ?? req.cookies.get("refresh")?.value;
  const p = token ? decodeJwt(token) : null;
  if (!p) return { authed: false, player: false, organizer: false, admin: false, verified: false };
  return {
    authed: true,
    player: p.is_player !== false,
    organizer: !!p.is_organizer,
    admin: !!p.is_platform_admin,
    verified: p.email_verified !== false,
  };
}

const GUEST_ONLY = ["/login", "/register", "/forgot", "/reset"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const role = readRole(req);

  // экраны, отложенные на v2, — 404, пока не включён флаг FEATURE_<NAME>
  if (isDeferredRoute(pathname)) return NextResponse.rewrite(new URL("/__not-found", req.url));

  const toLogin = () => {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  };

  if (GUEST_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (role.authed) return NextResponse.redirect(new URL(role.organizer ? "/org" : "/me", req.url));
    return NextResponse.next();
  }

  const needsAuth =
    pathname.startsWith("/me") ||
    pathname.startsWith("/settings") ||
    pathname === "/verify" ||
    /^\/tournaments\/[^/]+\/apply/.test(pathname) ||
    pathname.startsWith("/org") ||
    pathname.startsWith("/control");

  if (!needsAuth) return NextResponse.next();
  if (!role.authed) return toLogin();

  if (!role.verified && pathname !== "/verify") return NextResponse.redirect(new URL("/verify", req.url));
  if (pathname.startsWith("/org") && !role.organizer) return NextResponse.redirect(new URL("/pricing", req.url));
  // /control прячем от всех, кроме админов платформы: показываем 404, а не «нет доступа»
  if (pathname.startsWith("/control") && !role.admin) return NextResponse.rewrite(new URL("/__not-found", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
