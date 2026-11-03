"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sb, ensureCustomer, safeName } from "@/lib/customer";
import { imgUrl } from "@/lib/data";

const time = (s: string) => new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const label: any = { pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
  unpaid: "Unpaid", submitted: "Awaiting verification", paid: "Paid" };

function SignedImg({ path }: { path: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => { sb.storage.from("chat-attachments").createSignedUrl(path, 3600).then((r) => setUrl(r.data?.signedUrl ?? "")); }, [path]);
  return url ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="attachment" loading="lazy" className="max-h-48 rounded-lg" /></a> : <span className="text-xs text-muted">Loading image…</span>;
}

export default function Chat() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "pay" | "orders">("chat");
  const [uid, setUid] = useState<string | null>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [online, setOnline] = useState(false);
  const [pay, setPay] = useState<any>({});
  const [utr, setUtr] = useState("");
  const [err, setErr] = useState("");
  const activeRef = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  activeRef.current = active;

  const load = useCallback(async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    setUid(session.user.id);
    const [c, o] = await Promise.all([
      sb.from("conversations").select("*").order("last_message_at", { ascending: false }),
      sb.from("orders").select("*").order("created_at", { ascending: false })]);
    setConvs(c.data ?? []); setOrders(o.data ?? []);
    setActive((a) => a ?? c.data?.[0]?.id ?? null);
  }, []);

  // initial load, payment settings, owner presence
  useEffect(() => {
    load();
    sb.from("settings").select("value").eq("key", "payment").maybeSingle().then((r) => setPay(r.data?.value ?? {}));
    const p = sb.channel("owner-presence");
    p.on("presence", { event: "sync" }, () =>
      setOnline(Object.values(p.presenceState()).flat().some((x: any) => x.role === "admin"))).subscribe();
    const h = async (e: any) => {
      await load();
      if (e.detail?.conversationId) setActive(e.detail.conversationId);
      setTab(e.detail?.tab ?? "chat"); setOpen(true);
    };
    window.addEventListener("ssr:chat", h);
    return () => { sb.removeChannel(p); window.removeEventListener("ssr:chat", h); };
  }, [load]);

  // realtime (RLS limits events to this customer's rows)
  useEffect(() => {
    if (!uid) return;
    const ch = sb.channel("cust-" + uid)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        if (p.new.conversation_id === activeRef.current) setMsgs((m) => (m.some((x) => x.id === p.new.id) ? m : [...m, p.new]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [uid, load]);

  // load messages for active conversation
  useEffect(() => {
    if (!active) return setMsgs([]);
    sb.from("messages").select("*").eq("conversation_id", active).order("created_at").then((r) => setMsgs(r.data ?? []));
  }, [active]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open, tab]);

  // mark read while the chat tab is open
  const conv = convs.find((c) => c.id === active);
  useEffect(() => {
    if (open && tab === "chat" && conv?.unread_customer > 0)
      sb.rpc("mark_conversation_read", { p_conversation: active }).then(() => load());
  }, [open, tab, active, conv?.unread_customer, load]);

  const unread = convs.reduce((n, c) => n + (c.unread_customer ?? 0), 0);
  const order = orders.find((o) => o.id === conv?.order_id);

  const start = async () => {
    if (!name.trim()) return;
    try {
      const id = await ensureCustomer(name.trim());
      const { data, error } = await sb.from("conversations").insert({ customer_id: id, customer_name: name.trim() }).select().single();
      if (error) throw error;
      await load(); setActive(data.id);
    } catch (e: any) { setErr(e.message); }
  };
  const send = async (body: string, image_path?: string) => {
    if (!active) return;
    const { data, error } = await sb.from("messages").insert({ conversation_id: active, sender_role: "customer", body, image_path: image_path ?? null }).select().single();
    if (error) return setErr(error.message);
    setErr(""); setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
  };
  const attach = async (f?: File) => {
    if (!f || !uid) return;
    if (f.size > 5 * 1024 * 1024) return setErr("Max image size is 5 MB.");
    const path = `${uid}/${crypto.randomUUID()}-${safeName(f.name)}`;
    const { error } = await sb.storage.from("chat-attachments").upload(path, f);
    if (error) return setErr(error.message);
    await send("", path);
  };
  const submitPay = async () => {
    const { error } = await sb.from("payments").insert({ order_id: order.id, amount_inr: order.price_inr, reference: utr.trim() || null });
    if (error) setErr(error.message); else { setUtr(""); setErr(""); load(); }
  };
  const copy = (t: string) => navigator.clipboard?.writeText(t).catch(() => {});

  return (
    <>
      <button onClick={() => setOpen(!open)} aria-label="Open chat"
        className="btn btn-primary fixed bottom-5 right-5 z-[55] grid h-14 w-14 place-items-center !p-0 text-2xl">
        {open ? "✕" : "💬"}
        {!open && unread > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1 text-xs">{unread}</span>}
      </button>
      {open && (
        <div className="glass fixed bottom-24 right-3 z-[55] flex h-[72vh] w-[min(94vw,390px)] flex-col overflow-hidden rounded-2xl">
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center justify-between">
              <b>Chat with Shivam</b>
              <span className="flex items-center gap-1.5 text-xs text-muted"><i className={`h-2 w-2 rounded-full ${online ? "bg-green-400" : "bg-gray-500"}`} />{online ? "Online" : "Offline"}</span>
            </div>
            <div className="mt-2 flex gap-1 text-sm">
              {(["chat", "pay", "orders"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 capitalize ${tab === t ? "bg-primary" : "text-muted"}`}>{t === "pay" ? "Payment" : t}</button>))}
            </div>
          </div>

          {tab === "chat" && (!active ? (
            <div className="flex flex-1 flex-col justify-center gap-3 p-5">
              <p className="text-sm text-muted">{online ? "Say hi! I'll reply here." : "I'm offline right now. Leave your inquiry and I'll reply when I'm back."}</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="glass rounded-xl px-3 py-2 outline-none" />
              <button onClick={start} className="btn btn-primary">Start Chat</button>
              {err && <p className="text-sm text-red-400">{err}</p>}
            </div>
          ) : (
            <>
              {convs.length > 1 && (
                <select value={active} onChange={(e) => setActive(e.target.value)} className="glass m-2 rounded-lg p-1.5 text-sm">
                  {convs.map((c) => <option key={c.id} value={c.id}>{orders.find((o) => o.id === c.order_id)?.order_code ?? "General inquiry"}</option>)}</select>)}
              {order && <p className="px-3 pt-2 text-xs text-lav">Order {order.order_code} · {order.service_name}</p>}
              {!online && <p className="mx-3 mt-2 rounded-lg bg-white/5 p-2 text-xs text-muted">I'm offline right now. Your messages are saved and I'll reply when I'm back.</p>}
              {conv?.status === "resolved" && <p className="mx-3 mt-2 text-xs text-muted">This conversation was marked resolved. Send a message to reopen it.</p>}
              <div className="flex-1 space-y-2 overflow-auto p-3">
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === "customer" ? "justify-end" : ""}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_role === "customer" ? "bg-primary" : "bg-card"}`}>
                      {m.image_path && <SignedImg path={m.image_path} />}
                      {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                      <p className="mt-1 text-right text-[10px] opacity-60">{time(m.created_at)}</p>
                    </div>
                  </div>))}
                <div ref={endRef} />
              </div>
              {err && <p className="px-3 text-xs text-red-400">{err}</p>}
              <form className="flex items-center gap-2 border-t border-white/10 p-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { send(text.trim()); setText(""); } }}>
                <label className="cursor-pointer px-1 text-xl">📎<input type="file" accept="image/*" hidden onChange={(e) => attach(e.target.files?.[0])} /></label>
                <input value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="Type a message…" className="glass min-w-0 flex-1 rounded-full px-3 py-2 text-sm outline-none" />
                <button className="btn btn-primary !px-4 !py-2 text-sm">Send</button>
              </form>
            </>
          ))}

          {tab === "pay" && (
            <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
              {!order ? <p className="text-muted">Place an order to see payment details.</p> : (<>
                <div className="card p-3"><p className="text-muted">Order ID</p><p className="font-bold">{order.order_code}</p>
                  <p className="mt-2 text-muted">Amount</p><p className="grad-text text-2xl font-bold">₹{order.price_inr.toLocaleString("en-IN")}</p>
                  <p className="mt-2">Payment status: <b>{label[order.payment_status]}</b></p></div>
                <p className="font-semibold">Pay via UPI</p>
                {pay.upi_id ? (<div className="glass flex items-center justify-between rounded-xl p-3"><span className="break-all">{pay.upi_id}</span>
                  <button onClick={() => copy(pay.upi_id)} className="btn btn-ghost !px-3 !py-1 text-xs">Copy</button></div>)
                  : <p className="text-muted">UPI details haven't been added yet. Please ask me in the chat.</p>}
                {pay.upi_id && <a href={`upi://pay?pa=${encodeURIComponent(pay.upi_id)}&pn=KnowAboutSSR&am=${order.price_inr}&cu=INR&tn=${order.order_code}`} className="btn btn-primary block text-center">Pay ₹{order.price_inr.toLocaleString("en-IN")} in UPI app (mobile)</a>}
                <img src={pay.qr_path ? imgUrl(pay.qr_path)! : "/upi-qr.webp"} alt="UPI QR code" className="mx-auto w-48 rounded-xl bg-white p-2" />
                <p className="text-muted">{pay.instructions || `Pay the exact amount, then enter your UPI transaction reference (UTR) below. Payment is verified manually before work is marked paid.`}</p>
                {order.payment_status === "unpaid" && (<>
                  <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="UTR / transaction reference" className="glass w-full rounded-xl px-3 py-2 outline-none" />
                  <button onClick={submitPay} className="btn btn-primary w-full">I've Paid — Confirm</button></>)}
                {err && <p className="text-red-400">{err}</p>}
              </>)}
            </div>)}

          {tab === "orders" && (
            <div className="flex-1 space-y-2 overflow-auto p-3 text-sm">
              {orders.length === 0 && <p className="p-2 text-muted">No orders yet.</p>}
              {orders.map((o) => (
                <button key={o.id} className="card w-full p-3 text-left" onClick={() => { const c = convs.find((x) => x.order_id === o.id); if (c) setActive(c.id); setTab("chat"); }}>
                  <div className="flex justify-between"><b>{o.order_code}</b><span className="text-lav">₹{o.price_inr.toLocaleString("en-IN")}</span></div>
                  <p className="text-muted">{o.service_name}</p>
                  <p className="mt-1 text-xs">{label[o.status]} · {label[o.payment_status]}</p>
                </button>))}
            </div>)}
        </div>)}
    </>);
}
