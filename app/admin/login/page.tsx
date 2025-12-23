"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const params = useSearchParams();

  const next = params.get("next") ?? "/admin/dashboard";
  const errorParam = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    const cleanedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanedEmail,
      password,
    });

    setBusy(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="card p-6">
        <div className="text-lg font-semibold">Admin Login</div>
        <div className="mt-1 text-sm text-slate-600">
          Sign in to manage services, availability, and appointments.
        </div>

        {errorParam === "not_admin" ? (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
            This account is not an admin. Set <code className="font-mono">profiles.is_admin</code> to{" "}
            <code className="font-mono">true</code> for this user.
          </div>
        ) : null}

        {err ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            {err}
          </div>
        ) : null}

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@clinic.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Password</label>
            <input
              className="input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button className="btn-primary w-full" disabled={busy || !email.trim() || !password}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          <Link href="/" className="text-ink-700">
            Back to site
          </Link>
        </div>
      </div>
    </main>
  );
}
