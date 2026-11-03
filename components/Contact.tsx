"use client";
import { useState } from "react";
import Reveal from "./Reveal";

export function Socials({ cfg }: { cfg: any }) {
  const so = cfg.socials ?? {}; const c = cfg.contact ?? {};
  const cards = [
    ...(so.instagram ?? []).map((i: any) => ({ p: "Instagram", h: `@${i.handle}`, url: i.url })),
    so.youtube && { p: "YouTube", h: so.youtube.handle, url: so.youtube.url },
    { p: "Discord", h: c.discord ?? "Coming Soon", url: null },
  ].filter(Boolean);
  return (
    <section id="profile" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal><h2 className="text-4xl font-bold">Find Me <span className="grad-text">Online</span></h2></Reveal>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s: any, i: number) => (
          <Reveal key={s.p + s.h} delay={i * .08}>
            <div className="card flex h-full flex-col p-5">
              <p className="text-sm text-lav">{s.p}</p>
              <p className="mt-1 flex-1 text-lg font-semibold">{s.h}</p>
              {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4 text-center text-sm">Follow Me</a>
                : <span className="btn btn-ghost mt-4 text-center text-sm text-muted">Coming Soon</span>}
            </div>
          </Reveal>))}
      </div>
    </section>);
}

export function Contact({ cfg }: { cfg: any }) {
  const email = cfg.contact?.email ?? ""; const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 py-24 text-center">
      <Reveal>
        <h2 className="text-4xl font-extrabold sm:text-6xl">LET&apos;S BUILD <span className="grad-text">SOMETHING AMAZING.</span></h2>
        <p className="mt-4 text-muted">{email}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={`mailto:${email}`} className="btn btn-primary">Contact Me</a>
          <a href="#services" className="btn btn-ghost">Start a Project</a>
          <button onClick={() => window.dispatchEvent(new CustomEvent("ssr:chat", { detail: {} }))} className="btn btn-ghost">Chat Now</button>
          <button onClick={copy} className="btn btn-ghost">{copied ? "Copied ✓" : "Copy Email"}</button>
        </div>
      </Reveal>
      <footer className="mt-20 text-sm text-muted">© {new Date().getFullYear()} {cfg.site?.name} · {cfg.site?.owner} · <a href="/privacy" className="underline">Privacy</a> · <a href="/terms" className="underline">Terms</a></footer>
    </section>);
}
