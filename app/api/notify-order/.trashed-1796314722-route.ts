import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Called by a Supabase Database Webhook on INSERT into public.orders.
// Secrets stay server-side (never NEXT_PUBLIC_).
export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET ?? "";
  const got = req.headers.get("x-webhook-secret") ?? "";
  const ok = secret.length > 0 && got.length === secret.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const o = body?.record;
  if (body?.type !== "INSERT" || !o?.order_code) return NextResponse.json({ ok: true, skipped: true });

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ error: "email not configured" }, { status: 500 });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const text = [
    `New order ${o.order_code}`, "",
    `Service: ${o.service_name}`, `Price: ₹${o.price_inr}`, `Customer: ${o.customer_name}`, "",
    "Requirements:", String(o.requirements ?? "").slice(0, 1500), "",
    `Reference images: ${(o.reference_images ?? []).length}`,
    `Open admin: ${site}/admin`,
  ].join("\n");

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM ?? "KnowAboutSSR <onboarding@resend.dev>",
      to: [process.env.NOTIFY_EMAIL ?? "parlegez@gmail.com"],
      subject: `New order ${o.order_code} — ${o.service_name} (₹${o.price_inr})`,
      text,
    }),
  });
  if (!r.ok) return NextResponse.json({ error: "send failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
