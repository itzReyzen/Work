import { supabase } from "./supabase";
export const sb = supabase();

// Customers get an anonymous Supabase session (no signup). Returns their user id.
export async function ensureCustomer(name: string) {
  let { data: { session } } = await sb.auth.getSession();
  if (!session) {
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  const uid = session!.user.id;
  const { error } = await sb.from("customers").upsert({ id: uid, name }, { onConflict: "id" });
  if (error) throw error;
  return uid;
}

export const safeName = (n: string) => n.replace(/[^\w.-]/g, "_");
