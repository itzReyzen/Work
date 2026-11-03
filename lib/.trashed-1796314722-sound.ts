// Subtle UI sounds via WebAudio. OFF by default; only plays after the visitor turns it on.
let ctx: AudioContext | null = null;
export const soundOn = () => typeof localStorage !== "undefined" && localStorage.getItem("ssr-sound") === "1";
export function play(kind: "click" | "open" | "success") {
  if (!soundOn()) return;
  try {
    if (!ctx) ctx = new AudioContext();
    const [f1, f2, d] = kind === "success" ? [520, 880, 0.25] : kind === "open" ? [400, 600, 0.14] : [600, 420, 0.07];
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(t + d);
  } catch {}
}
