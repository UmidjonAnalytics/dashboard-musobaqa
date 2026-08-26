import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SITE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = NextResponse.redirect(`${SITE_URL}/`);
  response.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
