"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function Counter({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let f = 0; const t = setInterval(() => { f++; setN(Math.round((to * f) / 40)); if (f >= 40) clearInterval(t); }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <>{n}</>;
}

function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (document.documentElement.dataset.reduce === "1") { setN(text.length); return; }
    const t = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 70);
    return () => clearInterval(t);
  }, [text]);
  return <>{text.slice(0, n)}<span className="animate-pulse">|</span></>;
}

export default function Hero({ cfg }: { cfg: any }) {
  const stats = cfg.stats ?? {}; const p = cfg.profile ?? {}; const s = cfg.site ?? {};
  const items = [[stats.experience_years, "Years Experience"], [stats.completed_projects, "Completed Projects"], [stats.pending_projects, "Pending Projects"]];
  return (
    <section id="home" className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 pb-16 pt-28 md:grid-cols-2">
      <div>
        <p className="glass mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"><i className="h-2 w-2 rounded-full bg-green-400" />{s.status}</p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tracking-[0.35em] text-lav text-sm">HELLO, WORLD!</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
          className="mt-3 text-5xl font-extrabold leading-tight sm:text-7xl">I AM SHIVAM</motion.h1>
        <p className="grad-text mt-2 text-2xl font-bold uppercase sm:text-3xl">{s.owner}</p>
        <p className="mt-3 min-h-[1.75rem] text-lg text-lav"><Typed text="Developer / Designer / Creator" /></p>
        <p className="mt-4 max-w-md text-muted">{p.intro}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#works" className="btn btn-primary">Explore My Work</a>
          <a href="#services" className="btn btn-ghost">Hire Me</a>
        </div>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-md">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-electric opacity-40 blur-3xl" />
        {/* Drop your original hero art at /public/hero.png (transparent PNG/WebP works best) */}
        <img src="/hero.png" alt="" className={`relative h-full w-full object-contain ${s.hero_blend ? "mix-blend-screen" : ""} drop-shadow-[0_0_40px_rgba(168,85,247,.6)]`}
          onError={(e) => (e.currentTarget.style.display = "none")} />
      </div>
      <div className="grid grid-cols-3 gap-3 md:col-span-2">
        {items.map(([v, l]) => (
          <div key={l as string} className="glass rounded-2xl p-4 text-center">
            <div className="grad-text text-3xl font-extrabold sm:text-4xl"><Counter to={Number(v ?? 0)} /></div>
            <div className="mt-1 text-xs text-muted sm:text-sm">{l}</div>
          </div>))}
      </div>
    </section>);
}
