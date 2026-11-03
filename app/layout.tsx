import "./globals.css";
import { Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
const font = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "KnowAboutSSR — Shivam Singh Rajput | Developer, Designer, Creator",
  description: "Websites, Minecraft mods & plugins, thumbnails, graphics and more by Shivam Singh Rajput. See services, pricing and work, then order directly.",
  openGraph: { title: "KnowAboutSSR", description: "Developer / Designer / Creator", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={font.className}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: "Shivam Singh Rajput", jobTitle: "Website Developer & Designer", url: process.env.NEXT_PUBLIC_SITE_URL,
      sameAs: ["https://www.instagram.com/its.shivamsr/", "https://www.instagram.com/uff.shivamsr/", "https://www.youtube.com/@Mrhekkaro"] }) }} />
    {children}</body></html>);
}
