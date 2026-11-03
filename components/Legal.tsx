export default function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (<main className="bg-aurora min-h-screen px-6 py-16"><article className="mx-auto max-w-3xl space-y-4 text-muted">
    <a href="/" className="text-lav">← Back to KnowAboutSSR</a><h1 className="grad-text text-4xl font-bold">{title}</h1>{children}</article></main>);
}
