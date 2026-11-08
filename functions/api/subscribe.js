// The Saturday Build signup form (Cloudflare version; on Netlify, Netlify Forms handled this).
// Saves the email in the D1 database and sends the reader to /thanks.
// To download the list: GET /api/subscribe with the stats password in the x-key header (returns CSV).
import { ensureTables } from "./_db.js";
import { onRequestGet as statsGate } from "./stats.js";

const EMAIL = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,}$/i;

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const done = (ok, status) => wantsJson
    ? Response.json({ ok }, { status })
    : Response.redirect(new URL(ok ? "/thanks" : "/?signup=invalid#news-h", request.url), 303);
  try {
    const form = await request.formData();
    if ((form.get("company") || "").toString().trim()) return done(true, 200); // honeypot
    const email = (form.get("email") || "").toString().trim().toLowerCase();
    if (!EMAIL.test(email)) return done(false, 400);
    const page = new URL(request.headers.get("referer") || "/", request.url).pathname.slice(0, 200);
    await ensureTables(env.DB);
    await env.DB.prepare(`INSERT OR IGNORE INTO subscribers (email, created, page) VALUES (?,?,?)`)
      .bind(email, new Date().toISOString(), page).run();
    return done(true, 200);
  } catch (e) {
    console.error("signup failed", e);
    return done(false, 500);
  }
}

export async function onRequestGet(ctx) {
  const gate = await statsGate(ctx);
  if (gate.status !== 200) return gate;
  const { results } = await ctx.env.DB.prepare(`SELECT email, created, page FROM subscribers ORDER BY created`).all();
  const csv = ["email,signed_up,page", ...results.map((r) => [r.email, r.created, r.page].map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=creative-digital-story-subscribers.csv", "cache-control": "no-store" } });
}
