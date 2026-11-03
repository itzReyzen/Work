"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/customer";
import { inp, SignedImg } from "./ui";
const STATUS = ["pending", "in_progress", "completed", "cancelled"];

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]); const [sel, setSel] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]); const [pays, setPays] = useState<any[]>([]); const [note, setNote] = useState("");
  const load = async () => { const { data } = await sb.from("orders").select("*").order("created_at", { ascending: false }); setOrders(data ?? []); };
  useEffect(() => { load(); const ch = sb.channel("adm-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load).subscribe(); return () => { sb.removeChannel(ch); }; }, []);
  const open = async (id: string) => {
    const [o, n, p] = await Promise.all([sb.from("orders").select("*").eq("id", id).single(),
      sb.from("order_notes").select("*").eq("order_id", id).order("created_at"), sb.from("payments").select("*").eq("order_id", id).order("created_at")]);
    setSel(o.data); setNotes(n.data ?? []); setPays(p.data ?? []); load();
  };
  const setStatus = async (status: string) => { await sb.from("orders").update({ status }).eq("id", sel.id); open(sel.id); };
  const payAct = async (id: string, status: string) => { await sb.from("payments").update({ status, verified_at: status === "verified" ? new Date().toISOString() : null }).eq("id", id); open(sel.id); };
  const addNote = async () => { if (!note.trim()) return; await sb.from("order_notes").insert({ order_id: sel.id, note: note.trim() }); setNote(""); open(sel.id); };
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
      <div className="space-y-2">{orders.length === 0 && <p className="text-muted">No orders yet.</p>}
        {orders.map((o) => (<button key={o.id} onClick={() => open(o.id)} className={`card w-full p-3 text-left ${sel?.id === o.id ? "!border-electric" : ""}`}>
          <div className="flex justify-between"><b>{o.order_code}</b><span className="text-lav">₹{o.price_inr}</span></div>
          <p className="text-sm text-muted">{o.customer_name} · {o.service_name}</p>
          <p className="text-xs">{o.status} · {o.payment_status}</p></button>))}</div>
      {sel && (<div className="card space-y-4 p-4">
        <div><h3 className="text-xl font-bold">{sel.order_code}</h3><p className="text-sm text-muted">{sel.customer_name} · {new Date(sel.created_at).toLocaleString()}</p>
          <p className="mt-1">{sel.service_name} — <b>₹{sel.price_inr}</b></p></div>
        <p className="whitespace-pre-wrap text-sm">{sel.requirements}</p>
        <div className="flex flex-wrap gap-2">{(sel.reference_images ?? []).map((p: string) => <SignedImg key={p} path={p} />)}</div>
        <div><p className="mb-1 text-sm text-muted">Status</p><div className="flex flex-wrap gap-2">{STATUS.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-sm ${sel.status === s ? "bg-primary" : "glass text-muted"}`}>{s.replace("_", " ")}</button>))}</div></div>
        <div><p className="mb-1 text-sm text-muted">Payment: <b className="text-white">{sel.payment_status}</b></p>
          {pays.length === 0 && <p className="text-sm text-muted">No payment submitted.</p>}
          {pays.map((p) => (<div key={p.id} className="glass mb-2 rounded-lg p-2 text-sm">₹{p.amount_inr} · UTR: {p.reference ?? "—"} · {p.status}
            {p.status === "submitted" && <span className="ml-2 space-x-2"><button className="text-green-400" onClick={() => payAct(p.id, "verified")}>Verify</button><button className="text-red-400" onClick={() => payAct(p.id, "rejected")}>Reject</button></span>}</div>))}</div>
        <div><p className="mb-1 text-sm text-muted">Internal notes (private)</p>
          {notes.map((n) => <p key={n.id} className="glass mb-1 rounded-lg p-2 text-sm">{n.note}</p>)}
          <div className="flex gap-2"><input className={inp} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" /><button onClick={addNote} className="btn btn-primary !py-1.5 text-sm">Add</button></div></div>
      </div>)}
    </div>);
}
