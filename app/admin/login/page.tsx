import { Suspense } from "react";
import LoginClient from "./login-client";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-10">
          <div className="card p-6 text-sm text-slate-600">Loading…</div>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
