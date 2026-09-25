import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (!["127.0.0.1:3100", "localhost:3100"].includes(host ?? ""))
    return new NextResponse("Agent OS is restricted to this computer.", {
      status: 403,
    });
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
