import Legal from "@/components/Legal";
export const metadata = { title: "Privacy Policy — KnowAboutSSR" };
export default function Privacy() {
  return (<Legal title="Privacy Policy">
    <p><b>What I collect:</b> the name, requirements and reference images you submit with an order, your chat messages and attachments, and any UPI transaction reference you enter. No account or password is needed; your browser gets an anonymous session so your orders and chats stay linked to you.</p>
    <p><b>How it's used:</b> only to handle your order, reply to you and verify payment. I don't sell your data.</p>
    <p><b>Where it's stored:</b> with Supabase (database and file storage). Chat attachments are private and visible only to you and me.</p>
    <p><b>Your choices:</b> email parlegez@gmail.com to ask for your order or chat data to be deleted.</p>
    <p><b>Browser storage:</b> small preferences (theme, sound, reduced motion) are kept in your browser.</p>
  </Legal>);
}
