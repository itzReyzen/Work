"use client";
import { useState } from "react";
import Reveal from "./Reveal";
import { imgUrl } from "@/lib/data";

export default function Portfolio({ cats, projects }: { cats: any[]; projects: any[] }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<any>(null);
  const list = projects.filter((p) => (cat === "all" || p.category_id === cat) &&
    `${p.title} ${p.description}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section id="works" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal><h2 className="text-4xl font-bold">My <span className="grad-text">Works</span></h2></Reveal>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…"
          className="glass rounded-full px-4 py-2 text-sm outline-none focus:border-electric" />
        {[{ id: "all", name: "All" }, ...cats].map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm ${cat === c.id ? "bg-primary" : "glass text-muted hover:text-white"}`}>{c.name}</button>))}
      </div>
      {list.length === 0 ? (
        <p className="mt-10 text-center text-muted">{projects.length ? "No projects match your search." : "Projects will appear here soon."}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <button key={p.id} onClick={() => setOpen(p)} className="card overflow-hidden text-left">
              {imgUrl(p.image_path) && <img src={imgUrl(p.image_path)!} alt={p.title} loading="lazy" className="aspect-video w-full object-cover" />}
              <div className="p-4"><h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p></div>
            </button>))}
        </div>)}
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4" onClick={() => setOpen(null)}>
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
            {imgUrl(open.image_path) && <img src={imgUrl(open.image_path)!} alt={open.title} className="mb-4 w-full rounded-xl" />}
            <h3 className="text-2xl font-bold">{open.title}</h3>
            <p className="mt-1 text-sm text-lav">{open.project_date}</p>
            <p className="mt-3 text-muted">{open.description}</p>
            <div className="mt-5 flex gap-3">
              {open.external_url && <a href={open.external_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Project</a>}
              <button onClick={() => setOpen(null)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>)}
    </section>);
}
