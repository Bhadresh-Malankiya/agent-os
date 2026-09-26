import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const origin = new URL(process.env.APP_ORIGIN ?? "http://127.0.0.1:3100");
  const allowed = [origin.host];
  if (origin.hostname === "127.0.0.1") allowed.push(`localhost:${origin.port}`);
  if (!allowed.includes(host ?? ""))
    return new NextResponse("Agent OS is restricted to this computer.", {
      status: 403,
    });
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
