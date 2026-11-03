"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/customer";
import { inp, ImageField } from "./ui";
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Generic editor used for services, portfolio projects and testimonials.
export default function Crud({ table, catKind, fields, blank }: { table: string; catKind?: string; fields: any[]; blank: any }) {
  const [rows, setRows] = useState<any[]>([]); const [cats, setCats] = useState<any[]>([]);
  const [msg, setMsg] = useState(""); const [newCat, setNewCat] = useState("");
  const load = async () => {
    const [r, c] = await Promise.all([sb.from(table).select("*").order("created_at", { ascending: false }),
      catKind ? sb.from("categories").select("*").eq("kind", catKind).order("sort_order") : Promise.resolve({ data: [] as any[] })]);
    setRows(r.data ?? []); setCats(c.data ?? []); };
  useEffect(() => { load(); }, []);
  const patch = (id: string, k: string, v: any) => setRows((l) => l.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };
  const save = async (r: any) => {
    const body = Object.fromEntries(fields.map((f) => [f.k, r[f.k] === "" && ["date", "url", "image"].includes(f.type) ? null : r[f.k]]));
    const { error } = await sb.from(table).update(body).eq("id", r.id); flash(error ? error.message : "Saved ✓"); };
  const add = async () => { const { error } = await sb.from(table).insert({ ...blank, ...(catKind && cats[0] ? { category_id: cats[0].id } : {}) }); if (error) flash(error.message); load(); };
  const del = async (r: any) => { if (!confirm("Delete this item?")) return; if (r.image_path) sb.storage.from("site-images").remove([r.image_path]); await sb.from(table).delete().eq("id", r.id); load(); };
  const addCat = async () => { if (!newCat.trim()) return; const { error } = await sb.from("categories").insert({ kind: catKind, name: newCat.trim(), slug: slug(newCat), sort_order: cats.length + 1 }); if (error) flash(error.message); setNewCat(""); load(); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={add} className="btn btn-primary !py-2 text-sm">+ Add new</button>
        {catKind && <><input className={inp + " !w-48"} value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" /><button onClick={addCat} className="btn btn-ghost !py-2 text-sm">Add category</button></>}
        <span className="text-sm text-lav">{msg}</span></div>
      {rows.map((r) => (
        <div key={r.id} className="card grid gap-3 p-4 md:grid-cols-2">
          {fields.map((f) => (
            <label key={f.k} className={`text-xs text-muted ${f.type === "textarea" || f.type === "image" ? "md:col-span-2" : ""}`}>{f.label}
              {f.type === "textarea" ? <textarea rows={3} className={inp} value={r[f.k] ?? ""} onChange={(e) => patch(r.id, f.k, e.target.value)} />
                : f.type === "image" ? <div className="mt-1"><ImageField value={r[f.k]} folder={table} onChange={(p) => patch(r.id, f.k, p)} /></div>
                : f.type === "bool" ? <input type="checkbox" className="ml-2" checked={!!r[f.k]} onChange={(e) => patch(r.id, f.k, e.target.checked)} />
                : f.type === "cat" ? <select className={inp} value={r[f.k] ?? ""} onChange={(e) => patch(r.id, f.k, e.target.value || null)}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                : f.type === "select" ? <select className={inp} value={r[f.k]} onChange={(e) => patch(r.id, f.k, e.target.value)}>{f.options.map((o: string) => <option key={o}>{o}</option>)}</select>
                : <input className={inp} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={r[f.k] ?? ""} onChange={(e) => patch(r.id, f.k, f.type === "number" ? Number(e.target.value) : e.target.value)} />}
            </label>))}
          <div className="flex gap-3 md:col-span-2"><button onClick={() => save(r)} className="btn btn-primary !py-1.5 text-sm">Save</button><button onClick={() => del(r)} className="btn btn-ghost !py-1.5 text-sm text-red-400">Delete</button></div>
        </div>))}
    </div>);
}
