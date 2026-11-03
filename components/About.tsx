import Reveal from "./Reveal";
export default function About({ cfg }: { cfg: any }) {
  const s = cfg.site ?? {}, p = cfg.profile ?? {}, st = cfg.stats ?? {};
  const rows = [["Full Name", s.owner], ["Hometown", s.hometown], ["Experience", `${st.experience_years} Years`],
    ["Profession", (p.professions ?? []).join(", ")], ["Current Status", s.status], ["Working Style", p.working_style], ["Goal", p.goal]];
  return (
    <section id="about" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal><h2 className="text-4xl font-bold">Know About <span className="grad-text">Me</span></h2></Reveal>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Reveal className="card p-6">
          {p.about && <p className="mb-4 text-muted">{p.about}</p>}
          <dl className="space-y-3">{rows.map(([k, v]) => (
            <div key={k as string} className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>))}</dl>
        </Reveal>
        <Reveal delay={.1} className="card p-6">
          <h3 className="mb-4 text-xl font-semibold">Skills</h3>
          <div className="flex flex-wrap gap-2">{(cfg.skills ?? []).map((k: string) => (
            <span key={k} className="rounded-full border border-electric/40 bg-primary/10 px-3 py-1.5 text-sm text-lav">{k}</span>))}</div>
        </Reveal>
      </div>
    </section>);
}
