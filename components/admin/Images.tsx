"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/customer";
import { imgUrl } from "@/lib/data";
import { inp, uploadSite } from "./ui";

export default function Images() {
  const [concept, setConcept] = useState(""); const [style, setStyle] = useState("anime-inspired illustration");
  const [purple, setPurple] = useState(true); const [prompt, setPrompt] = useState(""); const [files, setFiles] = useState<any[]>([]);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const gen = () => setPrompt(`Create a ${style} of ${concept || "a stylish young developer-designer"}. ${purple ? "Purple and violet cinematic lighting with soft glowing effects, dark background (#090611), " : ""}clean composition, high detail, no text, no watermark, original character (not a real person or existing franchise character).`);
  const list = async () => { const out: any[] = [];
    for (const f of ["generated", "uploads", "services", "portfolio_projects", "settings"]) { const { data } = await sb.storage.from("site-images").list(f, { limit: 100 }); (data ?? []).filter((x) => x.id).forEach((x) => out.push(`${f}/${x.name}`)); }
    setFiles(out); };
  useEffect(() => { list(); }, []);
  const up = async (f?: File) => { if (!f) return; setBusy(true); try { const p = await uploadSite(f, "generated"); setMsg(`Uploaded & optimized → ${p}`); list(); } catch (e: any) { setMsg(e.message); } setBusy(false); };
  const rm = async (p: string) => { if (confirm("Delete this image? Anything using it will lose its picture.")) { await sb.storage.from("site-images").remove([p]); list(); } };
  return (<div className="space-y-6">
    <div className="card space-y-3 p-4"><h3 className="font-semibold">Image prompt generator</h3>
      <p className="text-xs text-muted">Copy the prompt into ChatGPT, then upload the result below. No API key is used.</p>
      <textarea className={inp} rows={2} value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Describe the image concept…" />
      <div className="flex flex-wrap items-center gap-3"><select className={inp + " !w-auto"} value={style} onChange={(e) => setStyle(e.target.value)}>{["anime-inspired illustration", "3D render", "minimal flat design", "futuristic poster"].map((s) => <option key={s}>{s}</option>)}</select>
        <label className="text-sm"><input type="checkbox" checked={purple} onChange={(e) => setPurple(e.target.checked)} /> Purple theme</label>
        <button onClick={gen} className="btn btn-primary !py-2 text-sm">Generate Image Prompt</button></div>
      {prompt && <div className="glass rounded-lg p-3 text-sm">{prompt}<button onClick={() => navigator.clipboard.writeText(prompt)} className="btn btn-ghost mt-2 block !py-1 text-xs">Copy prompt</button></div>}</div>
    <div className="card space-y-3 p-4"><h3 className="font-semibold">Upload an image (auto-optimized to WebP, max 1600px)</h3>
      <input type="file" accept="image/*" disabled={busy} onChange={(e) => up(e.target.files?.[0])} className="text-sm" /><p className="text-xs text-lav">{msg}</p></div>
    <div><h3 className="mb-2 font-semibold">Image library</h3><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{files.map((p) => (
      <div key={p} className="card p-2"><img src={imgUrl(p)!} loading="lazy" alt="" className="aspect-square w-full rounded-lg object-cover" />
        <p className="mt-1 truncate text-[10px] text-muted">{p}</p><div className="flex gap-2 text-xs"><button className="text-lav" onClick={() => navigator.clipboard.writeText(p)}>Copy path</button><button className="text-red-400" onClick={() => rm(p)}>Delete</button></div></div>))}</div></div></div>);
}
