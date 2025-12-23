"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      className="btn-ghost"
      onClick={async () => {
        const supabase = supabaseBrowser();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}

