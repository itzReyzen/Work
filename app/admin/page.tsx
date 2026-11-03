"use client";
import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/customer";
import Overview from "@/components/admin/Overview";
import Orders from "@/components/admin/Orders";
import Inbox from "@/components/admin/Inbox";
import Crud from "@/components/admin/Crud";
import Content from "@/components/admin/Content";
import Images from "@/components/admin/Images";

const SERVICE = [{ k: "name", label: "Name", type: "text" }, { k: "price_inr", label: "Price (₹)", type: "number" }, { k: "category_id", label: "Category", type: "cat" },
  { k: "is_available", label: "Available", type: "bool" }, { k: "description", label: "Description", type: "textarea" }, { k: "image_path", label: "Preview image", type: "image" }];
const PORT = [{ k: "title", label: "Project name", type: "text" }, { k: "category_id", label: "Category", type: "cat" }, { k: "project_date", label: "Date", type: "date" },
  { k: "status", label: "Status", type: "select", options: ["completed", "pending"] }, { k: "external_url", label: "Preview / external link", type: "text", nullableUrl: true },
  { k: "description", label: "Description", type: "textarea" }, { k: "image_path", label: "Project image", type: "image" }];
const TESTI = [{ k: "author_name", label: "Author", type: "text" }, { k: "rating", label: "Rating (1-5)", type: "number" }, { k: "is_published", label: "Published", type: "bool" }, { k: "body", label: "Testimonial", type: "textarea" }];
const IDLE_MS = 30 * 60 * 1000;

export default function Admin() {
  const [tab, setTab] = useState("overview"); const [unread, setUnread] = useState(0);
  const refresh = useCallback(async () => { const { data } = await sb.from("conversations").select("unread_admin"); setUnread((data ?? []).reduce((n: number, x: any) => n + x.unread_admin, 0)); }, []);
  const logout = async () => { await sb.auth.signOut(); window.location.href = "/admin/login"; };

  useEffect(() => { // presence: tells customers you're online
    const p = sb.channel("owner-presence", { config: { presence: { key: "owner" } } });
    p.subscribe(async (s) => { if (s === "SUBSCRIBED") await p.track({ role: "admin" }); });
    return () => { sb.removeChannel(p); }; }, []);
  useEffect(() => { // alerts
    refresh();
    const notify = (t: string, b: string) => { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(t, { body: b }); };
    const ch = sb.channel("adm-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => { if (p.new.sender_role === "customer") notify("New message", p.new.body?.slice(0, 80) || "Image"); refresh(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p: any) => notify("New order", p.new.order_code))
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, refresh).subscribe();
    return () => { sb.removeChannel(ch); }; }, [refresh]);
  useEffect(() => { document.title = unread ? `(${unread}) Admin — KnowAboutSSR` : "Admin — KnowAboutSSR"; }, [unread]);
  useEffect(() => { // session expiry on inactivity
    let t = setTimeout(logout, IDLE_MS);
    const reset = () => { clearTimeout(t); t = setTimeout(logout, IDLE_MS); };
    ["mousemove", "keydown", "click", "touchstart"].forEach((e) => window.addEventListener(e, reset));
    return () => { clearTimeout(t); ["mousemove", "keydown", "click", "touchstart"].forEach((e) => window.removeEventListener(e, reset)); }; }, []);

  const tabs: [string, string][] = [["overview", "Overview"], ["orders", "Orders"], ["inbox", `Chat${unread ? ` (${unread})` : ""}`], ["services", "Services"], ["portfolio", "Portfolio"], ["testimonials", "Testimonials"], ["content", "Content"], ["images", "Images & AI"]];
  return (
    <main className="min-h-screen bg-aurora p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="grad-text text-2xl font-bold">KnowAboutSSR Admin</h1>
        <div className="flex gap-2"><button onClick={() => typeof Notification !== "undefined" && Notification.requestPermission()} className="btn btn-ghost !py-1.5 text-sm">Enable notifications</button>
          <button onClick={logout} className="btn btn-ghost !py-1.5 text-sm">Logout</button></div></header>
      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${tab === k ? "bg-primary" : "glass text-muted"}`}>{l}</button>)}</nav>
      {tab === "overview" && <Overview />}
      {tab === "orders" && <Orders />}
      {tab === "inbox" && <Inbox />}
      {tab === "services" && <Crud table="services" catKind="service" fields={SERVICE} blank={{ name: "New service", price_inr: 0, is_available: false }} />}
      {tab === "portfolio" && <Crud table="portfolio_projects" catKind="portfolio" fields={PORT} blank={{ title: "New project" }} />}
      {tab === "testimonials" && <Crud table="testimonials" fields={TESTI} blank={{ author_name: "Name", body: "Testimonial text", rating: 5 }} />}
      {tab === "content" && <Content />}
      {tab === "images" && <Images />}
    </main>);
}
