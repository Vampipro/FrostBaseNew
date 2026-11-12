import { NextResponse, type NextRequest } from "next/server";

// Захист від CSRF: змінюючі запити тільки з нашого ж сайту.
export function middleware(req: NextRequest) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const site = req.headers.get("sec-fetch-site");
    if (origin) {
      let host = "";
      try { host = new URL(origin).host; } catch {}
      if (!host || host !== req.headers.get("host")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (site && site !== "same-origin" && site !== "none") {
      // без Origin, але браузер каже, що запит із чужого сайту
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
