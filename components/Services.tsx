"use client";
import { useState } from "react";
import Reveal from "./Reveal";
import { imgUrl } from "@/lib/data";

export default function Services({ cats, services }: { cats: any[]; services: any[] }) {
  const [cat, setCat] = useState("all");
  const list = services.filter((s) => cat === "all" || s.category_id === cat);
  // Phase 3 listens for this event to open the order modal.
  const order = (s: any) => window.dispatchEvent(new CustomEvent("ssr:order", { detail: s }));
  return (
    <section id="services" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal><h2 className="text-4xl font-bold">Services & <span className="grad-text">Pricing</span></h2></Reveal>
      <div className="mt-6 flex flex-wrap gap-2">
        {[{ id: "all", name: "All" }, ...cats].map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${cat === c.id ? "bg-primary text-white" : "glass text-muted hover:text-white"}`}>{c.name}</button>))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s, i) => (
          <Reveal key={s.id} delay={(i % 3) * .08}>
            <div className={`card flex h-full flex-col p-5 ${s.is_available ? "" : "opacity-60"}`}>
              {imgUrl(s.image_path) && <img src={imgUrl(s.image_path)!} alt={s.name} loading="lazy" className="mb-4 aspect-video w-full rounded-xl object-cover" />}
              <h3 className="text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{s.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="grad-text text-2xl font-bold">₹{s.price_inr.toLocaleString("en-IN")}</span>
                <button disabled={!s.is_available} onClick={() => order(s)} className="btn btn-primary py-2 text-sm disabled:opacity-50">
                  {s.is_available ? "Order Now" : "Unavailable"}</button>
              </div>
            </div>
          </Reveal>))}
      </div>
    </section>);
}
