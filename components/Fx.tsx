"use client";
import { useEffect, useRef } from "react";

// Custom cursor, floating particles and card tilt. All disabled when motion is reduced;
// cursor and tilt only run on devices with a precise pointer (not touch).
export default function Fx({ reduce }: { reduce: boolean }) {
  const ring = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduce || !matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      const t = e.target as HTMLElement;
      ring.current?.setAttribute("data-big", t.closest?.("a,button,label,[role=button]") ? "1" : "0");
      const el = t.closest?.("section .card") as HTMLElement | null;
      if (el && !el.closest(".glass") && !el.closest(".fixed")) {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${-py * 8}deg) rotateY(${px * 8}deg) translateY(-4px)`;
      }
    };
    const out = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest?.(".card") as HTMLElement | null;
      if (el && !el.contains(e.relatedTarget as Node)) el.style.transform = "";
    };
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      const big = ring.current?.getAttribute("data-big") === "1";
      if (ring.current) ring.current.style.transform = `translate(${rx}px,${ry}px) scale(${big ? 1.8 : 1})`;
      raf = requestAnimationFrame(loop);
    };
    document.addEventListener("pointermove", move); document.addEventListener("pointerout", out); loop();
    return () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerout", out);
      cancelAnimationFrame(raf); document.documentElement.classList.remove("has-cursor"); };
  }, [reduce]);

  useEffect(() => {
    const c = cv.current; if (!c || reduce) return;
    const g = c.getContext("2d")!; let raf = 0;
    const size = () => { c.width = innerWidth; c.height = innerHeight; }; size(); addEventListener("resize", size);
    const ps = Array.from({ length: 40 }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.8 + 0.4, v: Math.random() * 0.25 + 0.05 }));
    const draw = () => {
      const col = getComputedStyle(document.documentElement).getPropertyValue("--lav").trim() || "196 165 255";
      g.clearRect(0, 0, c.width, c.height); g.fillStyle = `rgb(${col} / .45)`;
      ps.forEach((p) => { p.y -= p.v; if (p.y < -5) { p.y = c.height + 5; p.x = Math.random() * c.width; } g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, [reduce]);

  return (<>
    <canvas ref={cv} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
    {!reduce && <div ref={ring} data-big="0" aria-hidden className="pointer-events-none fixed left-[-14px] top-[-14px] z-[110] hidden h-7 w-7 rounded-full border-2 border-electric mix-blend-screen transition-[width,height] [@media(pointer:fine)]:block" />}
  </>);
}
