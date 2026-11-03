import { createClient } from "@supabase/supabase-js";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const imgUrl = (p?: string | null) =>
  p ? `${URL}/storage/v1/object/public/site-images/${p}` : null;

export async function getSiteData() {
  const s = createClient(URL, KEY, { auth: { persistSession: false } });
  const [settings, cats, services, projects, testi] = await Promise.all([
    s.from("settings").select("*"),
    s.from("categories").select("*").order("sort_order"),
    s.from("services").select("*").order("sort_order"),
    s.from("portfolio_projects").select("*").order("project_date", { ascending: false }),
    s.from("testimonials").select("*").eq("is_published", true).order("created_at", { ascending: false }),
  ]);
  const cfg: Record<string, any> = Object.fromEntries((settings.data ?? []).map((r) => [r.key, r.value]));
  return { cfg, cats: cats.data ?? [], services: services.data ?? [], projects: projects.data ?? [], testimonials: testi.data ?? [] };
}
