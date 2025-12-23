import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export async function requireAdmin() {
  const supabase = await supabaseServer();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData.user;

  if (userErr || !user) {
    redirect("/admin/login");
  }

  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !prof?.is_admin) {
    redirect("/admin/login?error=not_admin");
  }

  return { user, prof };
}
