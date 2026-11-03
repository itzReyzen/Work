"use client";
import { useEffect, useState } from "react";
import { sb, ensureCustomer, safeName } from "@/lib/customer";

export default function OrderModal() {
  const [svc, setSvc] = useState<any>(null);
  const [name, setName] = useState("");
  const [req, setReq] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const h = (e: any) => { setSvc(e.detail); setErr(""); };
    window.addEventListener("ssr:order", h);
    return () => window.removeEventListener("ssr:order", h);
  }, []);
  if (!svc) return null;

  const confirm = async () => {
    if (!name.trim() || !req.trim()) return setErr("Please enter your name and requirements.");
    if (files.some((f) => f.size > 5 * 1024 * 1024)) return setErr("Each image must be under 5 MB.");
    setBusy(true); setErr("");
    try {
      const uid = await ensureCustomer(name.trim());
      const paths: string[] = [];
      for (const f of files.slice(0, 5)) {
        const p = `${uid}/${crypto.randomUUID()}-${safeName(f.name)}`;
        const { error } = await sb.storage.from("chat-attachments").upload(p, f);
        if (error) throw error;
        paths.push(p);
      }
      const { data: o, error: oe } = await sb.from("orders").insert({
        customer_id: uid, service_id: svc.id, customer_name: name.trim(),
        requirements: req.trim(), reference_images: paths }).select().single();
      if (oe) throw oe;
      const { data: c, error: ce } = await sb.from("conversations").insert({
        customer_id: uid, order_id: o.id, customer_name: name.trim() }).select().single();
      if (ce) throw ce;
      await sb.from("messages").insert({ conversation_id: c.id, sender_role: "customer",
        body: `New order ${o.order_code}: ${o.service_name} (₹${o.price_inr})\n\n${req.trim()}` });
      for (const p of paths)
        await sb.from("messages").insert({ conversation_id: c.id, sender_role: "customer", body: "", image_path: p });
      setSvc(null); setName(""); setReq(""); setFiles([]);
      window.dispatchEvent(new CustomEvent("ssr:chat", { detail: { conversationId: c.id, tab: "pay" } }));
    } catch (e: any) { setErr(e.message ?? "Something went wrong."); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4" onClick={() => !busy && setSvc(null)}>
      <div className="card max-h-[92vh] w-full max-w-md overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold">Confirm Order</h3>
        <div className="glass mt-4 flex items-center justify-between rounded-xl p-3">
          <span>{svc.name}</span>
          <span className="grad-text text-xl font-bold">₹{svc.price_inr.toLocaleString("en-IN")}</span>
        </div>
        <label className="mt-4 block text-sm text-muted">Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
          className="glass mt-1 w-full rounded-xl px-3 py-2 outline-none" />
        <label className="mt-4 block text-sm text-muted">Describe your requirements</label>
        <textarea value={req} onChange={(e) => setReq(e.target.value)} rows={4} maxLength={3000}
          className="glass mt-1 w-full rounded-xl px-3 py-2 outline-none" />
        <label className="mt-4 block text-sm text-muted">Reference images (optional, up to 5)</label>
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1 w-full text-sm text-muted" />
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <p className="mt-3 text-xs text-muted">Confirming creates your order and opens a chat with me. Payment is handled separately via UPI.</p>
        <div className="mt-5 flex gap-3">
          <button disabled={busy} onClick={confirm} className="btn btn-primary flex-1 disabled:opacity-60">{busy ? "Placing…" : "Confirm Order"}</button>
          <button disabled={busy} onClick={() => setSvc(null)} className="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>);
}
