import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";

// The Vercel Marketplace Upstash integration names these KV_REST_API_* (a
// holdover from the old Vercel KV branding), not the UPSTASH_REDIS_REST_*
// names @upstash/redis's own fromEnv() looks for.
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Mirrors ticketCodec.ts's MAX_ENCODED_LENGTH — a voiceme is never legitimately
// bigger than this, so reject oversized bodies before they hit storage.
const MAX_ENCODED_LENGTH = 6_000_000;
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const data = (req.body as { data?: unknown } | undefined)?.data;
  if (typeof data !== "string" || data.length === 0 || data.length > MAX_ENCODED_LENGTH) {
    return res.status(400).json({ error: "Invalid or oversized voiceme payload." });
  }

  const id = randomBytes(9).toString("base64url");
  await redis.set(id, data, { ex: TTL_SECONDS });

  return res.status(200).json({ id });
}
