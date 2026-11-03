"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/customer";
const cnt = async (t: string, f?: (q: any) => any) => {
  let q: any = sb.from(t).select("*", { count: "exact", head: true }); if (f) q = f(q);
  return (await q).count ?? 0; };
export default function Overview() {
  const [s, setS] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const [a, b, c, d, e, f, g] = await Promise.all([
      cnt("orders"), cnt("orders", (q) => q.eq("status", "completed")), cnt("orders", (q) => q.in("status", ["pending", "in_progress"])),
      cnt("orders", (q) => q.eq("status", "cancelled")), cnt("customers"), cnt("services", (q) => q.eq("is_available", true)),
      sb.from("conversations").select("unread_admin").then((r) => (r.data ?? []).reduce((n: number, x: any) => n + x.unread_admin, 0))]);
    setS([["Total Orders", a], ["Completed", b], ["Pending / In Progress", c], ["Cancelled", d], ["Customers", e], ["Available Services", f], ["Unread Messages", g]]);
  })(); }, []);
  return (<div className="grid grid-cols-2 gap-4 md:grid-cols-4">{s.map(([l, v]) => (
    <div key={l} className="card p-4"><div className="grad-text text-3xl font-bold">{v}</div><div className="text-sm text-muted">{l}</div></div>))}</div>);
}
