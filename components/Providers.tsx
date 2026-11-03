"use client";
import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { play } from "@/lib/sound";
import Fx from "./Fx";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [reduce, setReduce] = useState(false);
  const [theme, setTheme] = useState("purple");
  const [sound, setSound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prog, setProg] = useState(0);
  const [top, setTop] = useState(false);

  useEffect(() => {
    const r = localStorage.getItem("ssr-reduce");
    const rd = r ? r === "1" : matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(rd); setTheme(localStorage.getItem("ssr-theme") ?? "purple"); setSound(localStorage.getItem("ssr-sound") === "1");
    const t = setTimeout(() => setLoading(false), rd ? 0 : 1100);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme === "dark" ? "dark" : "purple"; document.documentElement.dataset.reduce = reduce ? "1" : "0"; }, [theme, reduce]);
  useEffect(() => {
    const on = () => { const h = document.documentElement; setProg(h.scrollTop / (h.scrollHeight - h.clientHeight || 1)); setTop(h.scrollTop > 600); };
    addEventListener("scroll", on, { passive: true }); return () => removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    const click = (e: MouseEvent) => { if ((e.target as HTMLElement).closest?.("a,button,label,[role=button]")) play("click"); };
    const chat = (e: any) => play(e.detail?.conversationId ? "success" : "open");
    document.addEventListener("click", click); addEventListener("ssr:chat", chat);
    return () => { document.removeEventListener("click", click); removeEventListener("ssr:chat", chat); };
  }, []);

  const flip = (key: string, cur: boolean, set: (v: boolean) => void) => { set(!cur); localStorage.setItem(key, !cur ? "1" : "0"); };
  const btn = "glass grid h-10 w-10 place-items-center rounded-full text-lg";
  return (
    <MotionConfig reducedMotion={reduce ? "always" : "user"}>
      <div className={`fixed inset-0 z-[100] grid place-items-center bg-ink transition-opacity duration-500 ${loading ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="text-center"><p className="grad-text text-4xl font-extrabold">KnowAboutSSR</p>
          <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded bg-white/10"><div className="h-full bg-electric" style={{ animation: "load 1s ease-out forwards" }} /></div></div>
      </div>
      <div className="fixed left-0 top-0 z-[90] h-1 bg-gradient-to-r from-primary to-electric" style={{ width: `${prog * 100}%` }} />
      <Fx reduce={reduce} />
      {children}
      <div className="fixed bottom-5 left-5 z-[55] flex flex-col gap-2">
        <button className={btn} title="Switch Purple / Dark mode" aria-label="Toggle theme" onClick={() => { const n = theme === "dark" ? "purple" : "dark"; setTheme(n); localStorage.setItem("ssr-theme", n); }}>{theme === "dark" ? "🟣" : "🌑"}</button>
        <button className={btn} title="Sound on/off" aria-label="Toggle sound" onClick={() => { flip("ssr-sound", sound, setSound); if (!sound) setTimeout(() => play("click"), 50); }}>{sound ? "🔊" : "🔇"}</button>
        <button className={btn} title="Reduce motion" aria-label="Toggle reduced motion" onClick={() => flip("ssr-reduce", reduce, setReduce)}>{reduce ? "🐢" : "✨"}</button>
      </div>
      {top && <button aria-label="Back to top" onClick={() => scrollTo({ top: 0 })} className="btn btn-primary fixed bottom-24 right-5 z-[55] grid h-11 w-11 place-items-center !p-0">↑</button>}
    </MotionConfig>);
}
