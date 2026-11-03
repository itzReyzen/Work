"use client";
import { useState } from "react";
import { sb } from "@/lib/customer";

export default function Login() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error || !data.user) { setErr("Invalid email or password."); return setBusy(false); }
    const { data: row } = await sb.from("admin_users").select("id").eq("id", data.user.id).maybeSingle();
    if (!row) { await sb.auth.signOut(); setErr("This account is not authorized."); return setBusy(false); }
    window.location.href = "/admin";
  };
  return (
    <main className="grid min-h-screen place-items-center bg-aurora p-4">
      <form onSubmit={go} className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="grad-text text-2xl font-bold">Admin Login</h1>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" className="glass w-full rounded-xl px-3 py-2 outline-none" />
        <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoComplete="current-password" className="glass w-full rounded-xl px-3 py-2 outline-none" />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="btn btn-primary w-full disabled:opacity-60">{busy ? "Signing in…" : "Sign In"}</button>
      </form>
    </main>);
}
