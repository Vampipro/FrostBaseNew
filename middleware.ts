import { NextResponse, type NextRequest } from "next/server";

// Захист від CSRF: запити, що змінюють дані, мають йти з того ж сайту.
export function middleware(req: NextRequest) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      let host = "";
      try { host = new URL(origin).host; } catch {}
      if (!host || host !== req.headers.get("host")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
