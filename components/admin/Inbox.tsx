"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sb } from "@/lib/customer";
import { inp, SignedImg } from "./ui";
const ts = (s: string) => new Date(s).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

export default function Inbox() {
  const [convs, setConvs] = useState<any[]>([]); const [orders, setOrders] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null); const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState(""); const [show, setShow] = useState("open");
  const ref = useRef<string | null>(null); ref.current = active;
  const endRef = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    const [c, o] = await Promise.all([sb.from("conversations").select("*").order("last_message_at", { ascending: false }), sb.from("orders").select("id,order_code,service_name,price_inr")]);
    setConvs(c.data ?? []); setOrders(o.data ?? []); }, []);
  const read = (id: string) => sb.rpc("mark_conversation_read", { p_conversation: id }).then(load);
  useEffect(() => {
    load();
    const ch = sb.channel("adm-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        if (p.new.conversation_id === ref.current) { setMsgs((m) => (m.some((x) => x.id === p.new.id) ? m : [...m, p.new])); if (p.new.sender_role === "customer") read(p.new.conversation_id); } })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [load]);
  useEffect(() => { if (!active) return; sb.from("messages").select("*").eq("conversation_id", active).order("created_at").then((r) => setMsgs(r.data ?? [])); read(active); }, [active]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const conv = convs.find((c) => c.id === active); const order = orders.find((o) => o.id === conv?.order_id);
  const send = async () => { if (!text.trim() || !active) return;
    const { data } = await sb.from("messages").insert({ conversation_id: active, sender_role: "admin", body: text.trim() }).select().single();
    if (data) setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data])); setText(""); };
  const toggle = async () => { await sb.from("conversations").update({ status: conv.status === "open" ? "resolved" : "open" }).eq("id", active); load(); };
  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <div>
        <div className="mb-2 flex gap-2 text-sm">{["open", "resolved"].map((s) => <button key={s} onClick={() => setShow(s)} className={`rounded-full px-3 py-1 capitalize ${show === s ? "bg-primary" : "glass text-muted"}`}>{s}</button>)}</div>
        <div className="space-y-2">{convs.filter((c) => c.status === show).map((c) => {
          const o = orders.find((x) => x.id === c.order_id);
          return (<button key={c.id} onClick={() => setActive(c.id)} className={`card w-full p-3 text-left ${active === c.id ? "!border-electric" : ""}`}>
            <div className="flex justify-between"><b>{c.customer_name || "Customer"}</b>{c.unread_admin > 0 && <span className="rounded-full bg-red-500 px-2 text-xs">{c.unread_admin}</span>}</div>
            <p className="text-xs text-muted">{o ? `${o.order_code} · ${o.service_name}` : "General inquiry"}</p></button>); })}</div>
      </div>
      {conv ? (<div className="card flex h-[70vh] flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-3"><div><b>{conv.customer_name}</b>
          <p className="text-xs text-lav">{order ? `Order ${order.order_code} · ${order.service_name} · ₹${order.price_inr}` : "General inquiry"}</p></div>
          <button onClick={toggle} className="btn btn-ghost !px-3 !py-1 text-sm">{conv.status === "open" ? "Mark Resolved" : "Reopen"}</button></div>
        <div className="flex-1 space-y-2 overflow-auto p-3">{msgs.map((m) => (
          <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : ""}`}><div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === "admin" ? "bg-primary" : "bg-ink"}`}>
            {m.image_path && <SignedImg path={m.image_path} />}{m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
            <p className="mt-1 text-right text-[10px] opacity-60">{ts(m.created_at)}</p></div></div>))}<div ref={endRef} /></div>
        <form className="flex gap-2 border-t border-white/10 p-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input className={inp} value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" /><button className="btn btn-primary !py-2 text-sm">Send</button></form>
      </div>) : <p className="text-muted">Select a conversation.</p>}
    </div>);
}
