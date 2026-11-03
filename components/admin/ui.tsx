"use client";
import { useEffect, useState } from "react";
import { sb, safeName } from "@/lib/customer";
import { imgUrl } from "@/lib/data";

export const inp = "glass w-full rounded-lg px-3 py-2 text-sm outline-none";

// Resize (max 1600px) + convert to WebP before upload.
export async function optimize(file: File, max = 1600): Promise<Blob> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file);
  const r = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b ?? file), "image/webp", 0.82));
}
export async function uploadSite(file: File, folder = "uploads") {
  const blob = await optimize(file);
  const ext = blob.type === "image/webp" ? "webp" : file.name.split(".").pop() || "img";
  const path = `${folder}/${Date.now()}-${safeName(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
  const { error } = await sb.storage.from("site-images").upload(path, blob, { contentType: blob.type });
  if (error) throw error;
  return path;
}
export function ImageField({ value, onChange, folder = "uploads" }: { value: string | null; onChange: (p: string | null) => void; folder?: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const drop = (old: string | null) => { if (old) sb.storage.from("site-images").remove([old]); };
  return (
    <div className="flex flex-wrap items-center gap-3">
      {value ? <img src={imgUrl(value)!} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-white/5" />}
      <label className="btn btn-ghost cursor-pointer !px-3 !py-1.5 text-xs">{busy ? "Uploading…" : value ? "Replace" : "Upload"}
        <input hidden type="file" accept="image/*" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return; setBusy(true); setErr("");
          try { const p = await uploadSite(f, folder); drop(value); onChange(p); } catch (x: any) { setErr(x.message); }
          setBusy(false); }} /></label>
      {value && <button type="button" className="text-xs text-red-400" onClick={() => { drop(value); onChange(null); }}>Remove</button>}
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>);
}
export function SignedImg({ path }: { path: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => { sb.storage.from("chat-attachments").createSignedUrl(path, 3600).then((r) => setUrl(r.data?.signedUrl ?? "")); }, [path]);
  return url ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="attachment" className="max-h-40 rounded-lg" /></a> : <span className="text-xs text-muted">…</span>;
}
