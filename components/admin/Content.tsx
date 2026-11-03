"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/customer";
import { inp, ImageField } from "./ui";

const clean = (v: any): any => Array.isArray(v) ? (v.every((x) => typeof x === "string") ? v.map((s) => s.trim()).filter(Boolean) : v.map(clean))
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)])) : v;

function Json({ v, on }: { v: any; on: (x: any) => void }) {
  const [t, setT] = useState(JSON.stringify(v, null, 2)); const [bad, setBad] = useState(false);
  return (<><textarea rows={8} className={inp + " font-mono"} value={t} onChange={(e) => { setT(e.target.value); try { on(JSON.parse(e.target.value)); setBad(false); } catch { setBad(true); } }} />
    {bad && <span className="text-xs text-red-400">Invalid JSON — not applied yet</span>}</>);
}
function Node({ label, v, on }: { label: string; v: any; on: (x: any) => void }) {
  const L = (c: any) => <label className="block text-xs text-muted">{label.replace(/_/g, " ")}{c}</label>;
  if (label.endsWith("_path")) return L(<div className="mt-1"><ImageField value={v} folder="settings" onChange={on} /></div>);
  if (typeof v === "boolean") return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label.replace(/_/g, " ")}</label>;
  if (typeof v === "number") return L(<input type="number" className={inp} value={v} onChange={(e) => on(Number(e.target.value))} />);
  if (typeof v === "string") return L(["intro", "about", "instructions", "text"].includes(label) ? <textarea rows={4} className={inp} value={v} onChange={(e) => on(e.target.value)} /> : <input className={inp} value={v} onChange={(e) => on(e.target.value)} />);
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return L(<textarea rows={Math.max(3, v.length + 1)} className={inp} value={v.join("\n")} onChange={(e) => on(e.target.value.split("\n"))} />);
  if (v && typeof v === "object" && !Array.isArray(v)) return <div className="space-y-3">{Object.entries(v).map(([k, x]) => <Node key={k} label={k} v={x} on={(y) => on({ ...v, [k]: y })} />)}</div>;
  return L(<Json v={v} on={on} />);
}

export default function Content() {
  const [cfg, setCfg] = useState<Record<string, any>>({}); const [msg, setMsg] = useState("");
  useEffect(() => { sb.from("settings").select("*").then((r) => setCfg(Object.fromEntries((r.data ?? []).map((x) => [x.key, x.value])))); }, []);
  const save = async (k: string) => { const { error } = await sb.from("settings").upsert({ key: k, value: clean(cfg[k]), updated_at: new Date().toISOString() }); setMsg(error ? error.message : `${k} saved ✓`); setTimeout(() => setMsg(""), 2500); };
  return (<div className="space-y-4"><p className="text-sm text-lav">{msg}</p>
    {Object.keys(cfg).map((k) => (<div key={k} className="card space-y-3 p-4"><h3 className="font-semibold capitalize">{k}</h3>
      <Node label={k} v={cfg[k]} on={(x) => setCfg((c) => ({ ...c, [k]: x }))} />
      <button onClick={() => save(k)} className="btn btn-primary !py-1.5 text-sm">Save {k}</button></div>))}</div>);
}
