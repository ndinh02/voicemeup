import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

// The Vercel Marketplace Upstash integration names these KV_REST_API_* (a
// holdover from the old Vercel KV branding), not the UPSTASH_REDIS_REST_*
// names @upstash/redis's own fromEnv() looks for.
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const id = req.query.id;
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,32}$/.test(id)) {
    return res.status(400).json({ error: "Invalid voiceme id." });
  }

  const data = await redis.get<string>(id);
  if (typeof data !== "string") {
    return res.status(404).json({ error: "This voiceme has expired or the link is invalid." });
  }

  return res.status(200).json({ data });
}
