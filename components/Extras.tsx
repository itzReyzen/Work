import Reveal from "./Reveal";

export function Testimonials({ items }: { items: any[] }) {
  if (!items.length) return null; // only real, published testimonials are ever shown
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal><h2 className="text-4xl font-bold">What Clients <span className="grad-text">Say</span></h2></Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-3">{items.map((t, i) => (
        <Reveal key={t.id} delay={i * 0.08}><div className="card h-full p-5">
          {t.rating && <p className="text-lav">{"★".repeat(t.rating)}</p>}
          <p className="mt-2 text-muted">{t.body}</p><p className="mt-3 font-semibold">{t.author_name}</p></div></Reveal>))}</div>
    </section>);
}

const QA = [
  ["How do I place an order?", "Pick a service, click Order Now, enter your name and requirements (reference images are optional), and confirm. You'll get an order ID and a chat with me opens automatically."],
  ["How do I pay?", "Payment is via UPI. After ordering, open the Payment tab in the chat for the UPI ID and QR, pay, then submit your UTR/transaction reference."],
  ["Is my order marked paid automatically?", "No. Payments are verified manually by me before an order is marked paid."],
  ["Can I request something custom?", "Yes. Describe it in your order or message me in the chat and we'll sort out the details."],
  ["How can I reach you?", "Use the chat on this site, or email me. If I'm offline, leave a message and I'll reply when I'm back."],
];
export function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <Reveal><h2 className="text-4xl font-bold">Common <span className="grad-text">Questions</span></h2></Reveal>
      <div className="mt-8 space-y-3">{QA.map(([q, a]) => (
        <details key={q} className="card group p-4"><summary className="cursor-pointer list-none font-semibold">{q}</summary><p className="mt-2 text-sm text-muted">{a}</p></details>))}</div>
    </section>);
}
