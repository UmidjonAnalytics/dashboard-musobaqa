import type { NextApiRequest, NextApiResponse } from "next";
import { buildLogoutCookie } from "@/lib/session";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Set-Cookie", buildLogoutCookie());
  res.redirect(302, "/");
}
