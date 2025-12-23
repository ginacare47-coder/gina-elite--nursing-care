"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

type Status = "pending" | "confirmed" | "in_progress" | "cancelled" | "finished";

type ServiceLite = {
  id: string;
  name: string;
  price_cents: number | null;
  duration_mins: number | null;
};

type Row = {
  id: string;
  date: string;
  time: string;
  status: Status;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;

  // Legacy single service join (keep as fallback for old rows)
  service: ServiceLite | null;

  // New many-to-many rows
  appointment_services?: Array<{ service: ServiceLite | null }> | null;
};

const STATUSES: Status[] = ["pending", "confirmed", "in_progress", "finished", "cancelled"];

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

function coerceStatus(s?: string | null): Status | null {
  if (!s) return null;
  return (STATUSES as string[]).includes(s) ? (s as Status) : null;
}

// If you already decided price_cents is "cents-like", keep /100.
// If your price_cents is actually whole XAF, remove the /100.
function formatXAF(priceCents: number) {
  const amount = Math.round(priceCents / 100);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeTime(t: string) {
  // "HH:MM:SS" -> "HH:MM"
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  return t;
}

export function AppointmentsManager({ initialStatus }: { initialStatus?: string }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const sp = useSearchParams();

  const fromUrl = coerceStatus(sp.get("status"));
  const fromProp = coerceStatus(initialStatus);

  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<Status>(fromUrl ?? fromProp ?? "pending");
  const [busy, setBusy] = useState(false);

  // per-row button loading
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // If URL changes (dashboard click), sync tab
  useEffect(() => {
    if (fromUrl && fromUrl !== tab) setTab(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  async function load() {
    setBusy(true);

    // ✅ Fetch new shape:
    // - appointment_services -> service details for multi-service bookings
    // - keep legacy service join as fallback
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        date,
        time,
        status,
        full_name,
        phone,
        email,
        address,
        service:services(id,name,price_cents,duration_mins),
        appointment_services(service:services(id,name,price_cents,duration_mins))
      `
      )
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    setBusy(false);

    if (error) {
      alert(error.message);
      return;
    }

    // normalize time to HH:MM for display consistency
    const cleaned = (data ?? []).map((r: any) => ({
      ...r,
      time: normalizeTime(String(r.time)),
    })) as Row[];

    setRows(cleaned);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeTab(next: Status) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("status", next);
    router.replace(url.pathname + url.search);
  }

  // ✅ update status via server route (now lowercase)
  async function setStatus(id: string, status: Status) {
    if (actionBusyId) return;
    setActionBusyId(id);

    try {
      const res = await fetch("/api/admin/appointments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to update status");

      await load();
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update status");
    } finally {
      setActionBusyId(null);
    }
  }

  const filtered = rows.filter((r) => r.status === tab);

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Appointments</div>
            <div className="mt-1 text-sm text-slate-600">
              Showing: <span className="font-semibold text-slate-900">{labelStatus(tab)}</span>
              {busy ? <span className="ml-2 text-xs text-slate-500">Loading...</span> : null}
            </div>
          </div>

          <button className="btn-ghost" type="button" onClick={load}>
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={"btn-ghost " + (tab === s ? "ring-2 ring-ink-300 bg-ink-50" : "")}
              onClick={() => changeTab(s)}
            >
              {labelStatus(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((a) => {
          const rowBusy = actionBusyId === a.id;

          // ✅ Build service list from new join table; fallback to legacy service column
          const newServices =
            a.appointment_services?.map((x) => x?.service).filter(Boolean) as ServiceLite[] | undefined;

          const services = (newServices && newServices.length ? newServices : a.service ? [a.service] : []) as ServiceLite[];

          const serviceNames = services.map((s) => s.name);
          const totalDuration = services.reduce((sum, s) => sum + (s.duration_mins ?? 0), 0);
          const totalPriceCents = services.reduce((sum, s) => sum + (s.price_cents ?? 0), 0);

          return (
            <div key={a.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-600">
                    {a.date} | {a.time}
                  </div>

                  <div className="mt-1 text-base font-semibold">
                    {serviceNames.length ? serviceNames.join(", ") : "Service"}
                  </div>

                  {/* Tiny extra line, still minimal UI change */}
                  {serviceNames.length ? (
                    <div className="mt-1 text-xs text-slate-600">
                      {totalDuration ? `${totalDuration} mins` : null}
                      {totalDuration && totalPriceCents ? " • " : null}
                      {totalPriceCents ? `${formatXAF(totalPriceCents)}` : null}
                    </div>
                  ) : null}

                  <div className="mt-2 text-sm text-slate-700">
                    <div>
                      <span className="text-slate-600">Client:</span> {a.full_name}
                    </div>
                    <div>
                      <span className="text-slate-600">Phone:</span> {a.phone}
                    </div>
                    {a.email ? (
                      <div>
                        <span className="text-slate-600">Email:</span> {a.email}
                      </div>
                    ) : null}
                    {a.address ? (
                      <div>
                        <span className="text-slate-600">Address:</span> {a.address}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {tab !== "confirmed" ? (
                    <button className="btn-primary" type="button" disabled={rowBusy} onClick={() => setStatus(a.id, "confirmed")}>
                      {rowBusy ? "Updating..." : "Confirm"}
                    </button>
                  ) : null}

                  {tab !== "in_progress" ? (
                    <button className="btn-ghost" type="button" disabled={rowBusy} onClick={() => setStatus(a.id, "in_progress")}>
                      {rowBusy ? "Updating..." : "Start"}
                    </button>
                  ) : null}

                  {tab !== "finished" ? (
                    <button className="btn-ghost" type="button" disabled={rowBusy} onClick={() => setStatus(a.id, "finished")}>
                      {rowBusy ? "Updating..." : "Finish"}
                    </button>
                  ) : null}

                  {tab !== "cancelled" ? (
                    <button className="btn-ghost" type="button" disabled={rowBusy} onClick={() => setStatus(a.id, "cancelled")}>
                      {rowBusy ? "Updating..." : "Cancel"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {!filtered.length ? (
          <div className="card p-10 text-center text-sm text-slate-600">No appointments in this status.</div>
        ) : null}
      </div>
    </div>
  );
}
