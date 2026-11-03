import { getSiteData } from "@/lib/data";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import { Testimonials, FAQ } from "@/components/Extras";
import { Socials, Contact } from "@/components/Contact";
import OrderModal from "@/components/OrderModal";
import Chat from "@/components/Chat";

export const dynamic = "force-dynamic"; // admin edits show instantly

export default async function Home() {
  const { cfg, cats, services, projects, testimonials } = await getSiteData();
  const site = cfg.site ?? {}; const ann = cfg.announcement;
  const banner = !!(ann?.enabled && ann?.text);
  if (site.maintenance_mode) {
    return (<main className="grid min-h-screen place-items-center bg-aurora p-6 text-center">
      <div><h1 className="grad-text text-4xl font-bold">{site.name} is under maintenance</h1><p className="mt-3 text-muted">Back shortly.</p></div></main>);
  }
  return (
    <Providers>
      <main className="bg-aurora">
        {banner && <div className="fixed inset-x-0 top-0 z-[60] bg-gradient-to-r from-primary to-electric px-3 py-2 text-center text-sm">{ann.text}</div>}
        <Navbar name={site.name ?? "KnowAboutSSR"} banner={banner} />
        <Hero cfg={cfg} />
        <About cfg={cfg} />
        <Socials cfg={cfg} />
        <Services cats={cats.filter((c) => c.kind === "service")} services={services} />
        <Portfolio cats={cats.filter((c) => c.kind === "portfolio")} projects={projects} />
        <Testimonials items={testimonials} />
        <FAQ />
        <Contact cfg={cfg} />
        <OrderModal />
        <Chat />
      </main>
    </Providers>);
}
