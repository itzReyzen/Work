"use client";
import { useEffect, useState } from "react";
const links = [["home","Home"],["about","About"],["profile","Profile"],["services","Services & Pricing"],["works","My Works"],["contact","Contact"]];
export default function Navbar({ name, banner = false }: { name: string; banner?: boolean }) {
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(([id]) => { const el = document.getElementById(id); el && io.observe(el); });
    return () => io.disconnect();
  }, []);
  const item = (id: string, label: string) => (
    <li key={id}><a href={`#${id}`} onClick={() => setOpen(false)}
      className={`block rounded-full px-3 py-1.5 text-sm transition ${active === id ? "bg-primary/40 text-white" : "text-muted hover:text-white"}`}>{label}</a></li>);
  return (
    <header className={`fixed inset-x-0 ${banner ? "top-12" : "top-4"} z-50 flex flex-col items-center px-4`}>
      <nav className="glass flex w-full max-w-4xl items-center justify-between rounded-full px-5 py-2.5">
        <a href="#home" className="font-bold tracking-tight">{name}</a>
        <ul className="hidden gap-1 md:flex">{links.map(([i, l]) => item(i, l))}</ul>
        <button className="md:hidden text-xl" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? "✕" : "☰"}</button>
      </nav>
      {open && <ul className="glass mt-2 w-full max-w-4xl rounded-2xl p-3 md:hidden">{links.map(([i, l]) => item(i, l))}</ul>}
    </header>);
}
