import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { AdminNav } from "@/components/AdminNav";

const STATUSES = ["pending", "confirmed", "in_progress", "finished", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

function labelStatus(s: Status) {
  switch (s) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In progress";
    case "finished":
      return "Finished";
    case "cancelled":
      return "Cancelled";
  }
}

function normalizeStatus(input: string): Status | null {
  const s = String(input ?? "").trim();

  // accept both old Title Case and new lowercase from RPC
  const lower = s.toLowerCase();

  if (lower === "pending") return "pending";
  if (lower === "confirmed") return "confirmed";
  if (lower === "in_progress") return "in_progress";
  if (lower === "in progress") return "in_progress";
  if (lower === "finished") return "finished";
  if (lower === "cancelled") return "cancelled";
  if (lower === "canceled") return "cancelled"; // US spelling fallback

  // old Title Case values
  if (s === "Pending") return "pending";
  if (s === "Confirmed") return "confirmed";
  if (s === "Finished") return "finished";
  if (s === "Cancelled") return "cancelled";

  return null;
}

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await supabaseServer();

  // one fast RPC call instead of fetching appointment rows
  const { data, error } = await supabase.rpc("appointment_status_counts");
  if (error) {
    // keep dashboard resilient if RPC not created yet
    console.error("appointment_status_counts RPC error:", error);
  }

  const tally: Record<Status, number> = {
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    finished: 0,
    cancelled: 0,
  };

  for (const row of (data ?? []) as Array<{ status: string; total: number }>) {
    const s = normalizeStatus(row.status);
    if (s) tally[s] = Number(row.total ?? 0);
  }

  const totalAll = Object.values(tally).reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <AdminNav />

      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Dashboard</div>
            <div className="mt-1 text-sm text-slate-600">
              Total appointments: <span className="font-semibold text-slate-900">{totalAll}</span>
            </div>
          </div>

          <Link href="/admin/appointments" className="text-sm text-ink-700 hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/appointments?status=${encodeURIComponent(status)}`}
              className="card p-4 transition hover:ring-2 hover:ring-ink-200 focus:outline-none focus:ring-2 focus:ring-ink-300"
            >
              <div className="text-xs text-slate-600">{labelStatus(status)}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{tally[status]}</div>
              <div className="mt-2 text-xs text-slate-500">Tap to filter</div>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-sm text-slate-600">Tip: Tap a card to jump to filtered appointments.</div>
      </div>
    </main>
  );
}
