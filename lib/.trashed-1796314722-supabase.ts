import { createBrowserClient } from "@supabase/ssr";
// Browser client (used by chat/orders in Phase 3 and admin in Phase 4).
export const supabase = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
