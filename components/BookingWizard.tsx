"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { ServiceCard, type Service } from "@/components/ServiceCard";

/**
 * ✅ Draft changes:
 * - supports multi-service bookings via serviceIds[]
 * - keeps legacy serviceId/serviceName for backward compatibility in drafts ONLY (NOT DB)
 */
type Draft = {
  // NEW (multi-service)
  serviceIds?: string[];
  serviceNames?: string[];

  // Legacy (keep for old drafts only; do NOT persist to DB)
  serviceId?: string;
  serviceName?: string;

  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;

  // ✅ prevent double-submit
  submitted?: boolean;
  submittedAt?: string;
};

const KEY = "nursecare_booking_draft_v1";

// Active statuses block slots (and are enforced by DB unique partial index if you have it)
const ACTIVE_STATUSES = ["pending", "confirmed", "in_progress"] as const;

function readDraft(): Draft {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

function writeDraft(next: Draft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(next));
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}

function fromMinutes(mins: number) {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeTimeHHMM(t: string) {
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  return t;
}

function isUniqueViolation(err: any) {
  // Postgres unique violation = 23505
  const code = err?.code ?? err?.details?.code;
  return code === "23505" || /duplicate key value|unique constraint/i.test(err?.message ?? "");
}

// ✅ Currency formatter: XAF everywhere
function fmtXAFfromCents(cents: number) {
  const amount = Math.round((Number(cents) || 0) / 100);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "XAF",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `XAF ${amount.toLocaleString()}`;
  }
}

// ✅ Fun pop overlay (no libs)
function PopSuccess({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div aria-live="polite" className="fixed inset-0 z-[60] grid place-items-center bg-black/20 backdrop-blur-[2px]">
      <div className="relative w-[92%] max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 pop-card">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 ring-1 ring-ink-200 pop-bounce">
          <span className="text-xl">🎉</span>
        </div>
        <div className="mt-3 text-lg font-semibold text-slate-900">Booked!</div>
        <div className="mt-1 text-sm text-slate-600">Your request is in. We’re doing a happy little paperwork dance.</div>

        <span className="confetti c1" aria-hidden />
        <span className="confetti c2" aria-hidden />
        <span className="confetti c3" aria-hidden />
        <span className="confetti c4" aria-hidden />
        <span className="confetti c5" aria-hidden />
        <span className="confetti c6" aria-hidden />

        <style jsx>{`
          .pop-card {
            animation: pop-in 420ms cubic-bezier(0.2, 1.4, 0.2, 1);
          }
          .pop-bounce {
            animation: bounce 650ms cubic-bezier(0.2, 1.4, 0.2, 1);
          }
          @keyframes pop-in {
            0% {
              transform: scale(0.86);
              opacity: 0;
            }
            60% {
              transform: scale(1.04);
              opacity: 1;
            }
            100% {
              transform: scale(1);
            }
          }
          @keyframes bounce {
            0% {
              transform: translateY(0) scale(1);
            }
            35% {
              transform: translateY(-6px) scale(1.06);
            }
            70% {
              transform: translateY(0) scale(1);
            }
            100% {
              transform: translateY(-1px) scale(1.01);
            }
          }
          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 3px;
            opacity: 0;
            animation: confetti 900ms ease-out forwards;
          }
          .c1 {
            left: 14%;
            top: 18%;
            background: #f59e0b;
            transform: rotate(20deg);
            animation-delay: 60ms;
          }
          .c2 {
            left: 28%;
            top: 10%;
            background: #22c55e;
            transform: rotate(55deg);
            animation-delay: 120ms;
          }
          .c3 {
            right: 22%;
            top: 12%;
            background: #3b82f6;
            transform: rotate(15deg);
            animation-delay: 90ms;
          }
          .c4 {
            right: 12%;
            top: 24%;
            background: #ef4444;
            transform: rotate(35deg);
            animation-delay: 160ms;
          }
          .c5 {
            left: 18%;
            bottom: 18%;
            background: #a855f7;
            transform: rotate(25deg);
            animation-delay: 140ms;
          }
          .c6 {
            right: 18%;
            bottom: 16%;
            background: #06b6d4;
            transform: rotate(65deg);
            animation-delay: 200ms;
          }
          @keyframes confetti {
            0% {
              opacity: 0;
              transform: translateY(8px) scale(0.7);
            }
            30% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateY(-22px) scale(1.05);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export function BookingWizard({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [draft, setDraft] = useState<Draft>({});
  const [services, setServices] = useState<Service[]>([]);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Array<{ day_of_week: number; start_time: string; end_time: string }>>(
    []
  );

  // slot interval (from public_settings if available)
  const [slotInterval, setSlotInterval] = useState<number>(30);

  // booked times for selected date (active statuses only)
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPop, setShowPop] = useState(false);

  // --- Draft boot + upgrade old schema (serviceId -> serviceIds)
  useEffect(() => {
    const d = readDraft();
    const upgraded: Draft = { ...d };

    if ((!upgraded.serviceIds || upgraded.serviceIds.length === 0) && upgraded.serviceId) {
      upgraded.serviceIds = [upgraded.serviceId];
      if (upgraded.serviceName) upgraded.serviceNames = [upgraded.serviceName];
    }

    if (upgraded.serviceIds && !Array.isArray(upgraded.serviceIds)) upgraded.serviceIds = [];
    if (upgraded.serviceNames && !Array.isArray(upgraded.serviceNames)) upgraded.serviceNames = [];

    setDraft(upgraded);
    writeDraft(upgraded);
  }, []);

  // --- Public data needed across steps
  useEffect(() => {
    (async () => {
      const { data: svcs } = await supabase
        .from("services")
        .select("id,name,description,price_cents,duration_mins,is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });

      setServices((svcs ?? []) as Service[]);

      const { data: blocked } = await supabase.from("blocked_dates").select("date");
      setBlockedDates(new Set((blocked ?? []).map((b: any) => b.date)));

      const { data: avail } = await supabase
        .from("availability")
        .select("day_of_week,start_time,end_time")
        .order("day_of_week", { ascending: true });

      setAvailability((avail ?? []) as any);

      try {
        const { data: ps, error: psErr } = await supabase.from("public_settings").select("slot_interval_minutes").maybeSingle();
        if (!psErr) {
          const v = Number((ps as any)?.slot_interval_minutes);
          if (Number.isFinite(v) && v > 0) setSlotInterval(v);
        }
      } catch {
        // ignore if table doesn't exist
      }
    })();
  }, [supabase]);

  function updateDraft(patch: Partial<Draft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      writeDraft(next);
      return next;
    });
  }

  const selectedServiceIds = draft.serviceIds ?? [];

  const selectedServices = useMemo(() => {
    if (!selectedServiceIds.length) return [];
    const map = new Map(services.map((s) => [s.id, s]));
    return selectedServiceIds.map((id) => map.get(id)).filter(Boolean) as Service[];
  }, [selectedServiceIds, services]);

  // UI-only fallback for older drafts or if services list hasn't loaded yet
  const primaryService = selectedServices[0] ?? services.find((s) => s.id === draft.serviceId);

  const totalDurationMins = useMemo(() => {
    const sum = selectedServices.reduce((acc, s) => acc + (s.duration_mins ?? 0), 0);
    return sum > 0 ? sum : (primaryService?.duration_mins ?? 0);
  }, [selectedServices, primaryService]);

  const totalPriceCents = useMemo(() => {
    const sum = selectedServices.reduce((acc, s: any) => acc + (Number(s.price_cents) || 0), 0);
    if (sum > 0) return sum;
    return Number((primaryService as any)?.price_cents) || 0;
  }, [selectedServices, primaryService]);

  const totalPriceXAF = useMemo(() => fmtXAFfromCents(totalPriceCents), [totalPriceCents]);

  const selectedCount = selectedServiceIds.length;

  const dateOptions = useMemo(() => {
    const out: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      if (!blockedDates.has(iso)) out.push(iso);
    }
    return out;
  }, [blockedDates]);

  // --- Fetch booked times when date changes (active statuses only)
  useEffect(() => {
    if (!draft.date) {
      setBookedTimes(new Set());
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("time,status")
        .eq("date", draft.date)
        .in("status", [...ACTIVE_STATUSES]);

      if (error) {
        setBookedTimes(new Set());
        return;
      }

      const times = new Set<string>();
      for (const row of data ?? []) {
        const t = normalizeTimeHHMM(String((row as any).time));
        times.add(t);
      }
      setBookedTimes(times);
    })();
  }, [draft.date, supabase]);

  const timeOptions = useMemo(() => {
    if (!draft.date) return [];

    const d = new Date(draft.date + "T00:00:00");
    const dow = d.getDay(); // 0=Sun
    const todays = availability.filter((a) => a.day_of_week === dow);
    if (!todays.length) return [];

    const interval = slotInterval || 30;
    const requiredSlots = Math.max(1, Math.ceil((totalDurationMins || interval) / interval));

    const candidates: string[] = [];

    for (const a of todays) {
      const start = toMinutes(normalizeTimeHHMM(a.start_time));
      const end = toMinutes(normalizeTimeHHMM(a.end_time));

      for (let cur = start; cur + requiredSlots * interval <= end; cur += interval) {
        candidates.push(fromMinutes(cur));
      }
    }

    const ok: string[] = [];
    const booked = bookedTimes;

    for (const startHHMM of candidates) {
      const startMins = toMinutes(startHHMM);
      let allFree = true;

      for (let i = 0; i < requiredSlots; i++) {
        const slotTime = fromMinutes(startMins + i * interval);
        if (booked.has(slotTime)) {
          allFree = false;
          break;
        }
      }

      if (allFree) ok.push(startHHMM);
    }

    return Array.from(new Set(ok)).sort();
  }, [draft.date, availability, slotInterval, totalDurationMins, bookedTimes]);

  useEffect(() => {
    if (!draft.time) return;
    if (!draft.date) return;

    const stillValid = timeOptions.includes(draft.time);
    if (!stillValid) {
      updateDraft({ time: undefined });
      setNotice("Your previously selected time no longer fits your selected services. Please choose another slot.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeOptions.join("|")]);

  function go(to: string) {
    setNotice(null);
    router.push(to);
  }

  function toggleService(s: Service) {
    const ids = new Set(selectedServiceIds);
    const names = new Map<string, string>();

    (draft.serviceNames ?? []).forEach((n, idx) => {
      const id = selectedServiceIds[idx];
      if (id && n) names.set(id, n);
    });

    if (ids.has(s.id)) {
      ids.delete(s.id);
      names.delete(s.id);
    } else {
      ids.add(s.id);
      names.set(s.id, s.name);
    }

    const nextIds = Array.from(ids);
    const nextNames = nextIds.map((id) => names.get(id) ?? services.find((x) => x.id === id)?.name ?? "");

    // Keep legacy fields ONLY for draft compatibility (UI). Not used in DB.
    const primaryId = nextIds[0];
    const primaryName = services.find((x) => x.id === primaryId)?.name;

    updateDraft({
      serviceIds: nextIds,
      serviceNames: nextNames,
      serviceId: primaryId,
      serviceName: primaryName ?? nextNames[0] ?? undefined,
    });
  }

  async function refreshBookedTimesForSelectedDate() {
    if (!draft.date) return;
    const { data, error } = await supabase
      .from("appointments")
      .select("time,status")
      .eq("date", draft.date)
      .in("status", [...ACTIVE_STATUSES]);

    if (error) return;
    const times = new Set<string>();
    for (const row of data ?? []) {
      times.add(normalizeTimeHHMM(String((row as any).time)));
    }
    setBookedTimes(times);
  }

  // ✅ FINAL: booking uses RPC (single transaction)
  async function confirmBooking() {
    if (submitting || draft.submitted) return;

    const svcIds = draft.serviceIds ?? (draft.serviceId ? [draft.serviceId] : []);
    if (!svcIds.length || !draft.date || !draft.time || !draft.fullName || !draft.phone) return;

    setSubmitting(true);
    setNotice(null);

    const { data: appointmentId, error: apptErr } = await supabase.rpc("create_appointment_with_services", {
      p_date: draft.date,
      p_time: draft.time,
      p_full_name: draft.fullName,
      p_phone: draft.phone,
      p_service_ids: svcIds,
      p_email: draft.email ?? null,
      p_address: draft.address ?? null,
    });

    if (apptErr) {
      if (isUniqueViolation(apptErr)) {
        alert("That slot was just booked, please choose another time.");
        await refreshBookedTimesForSelectedDate();
        setSubmitting(false);
        router.push("/booking/step-3-time");
        return;
      }

      alert(apptErr.message);
      setSubmitting(false);
      return;
    }

    const createdId = String(appointmentId);

    updateDraft({ submitted: true, submittedAt: new Date().toISOString() });

    setShowPop(true);
    window.setTimeout(() => setShowPop(false), 950);

    const hook = process.env.NEXT_PUBLIC_EMAIL_WEBHOOK_URL;
    if (hook) {
      try {
        const names =
          selectedServices.length > 0
            ? selectedServices.map((s) => s.name)
            : draft.serviceNames?.filter(Boolean) ?? [];

        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "booking_confirmed",
            appointmentId: createdId,
            serviceNames: names.length ? names : ["Service"],
            totalDurationMins,
            totalPriceXAF,
            totalPriceCents,
            date: draft.date,
            time: draft.time,
            fullName: draft.fullName,
            phone: draft.phone,
            email: draft.email ?? null,
            address: draft.address ?? null,
            adminEmail: process.env.NEXT_PUBLIC_ADMIN_NOTIFICATION_EMAIL ?? null,
          }),
        });
      } catch {
        // ignore
      }
    }

    setSubmitting(false);
  }

  // ---------------- STEP UI ----------------

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Select Service</div>
              <div className="mt-2 text-sm text-slate-600">Choose the care you need. Quick taps, zero fuss.</div>
            </div>

            <div className="shrink-0 rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-200">
              Selected ({selectedCount})
            </div>
          </div>

          {notice ? (
            <div className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-800 ring-1 ring-ink-200">{notice}</div>
          ) : null}
        </div>

        <div className="grid gap-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} selected={selectedServiceIds.includes(s.id)} onSelect={() => toggleService(s)} />
          ))}
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost w-full" type="button" onClick={() => go("/")}>
            Back
          </button>
          <button
            className="btn-primary w-full"
            type="button"
            disabled={selectedCount < 1}
            onClick={() => go("/booking/step-2-date")}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <div className="text-lg font-semibold">Select Date</div>
          <div className="mt-2 text-sm text-slate-600">Pick a day that works for you.</div>

          {notice ? (
            <div className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-800 ring-1 ring-ink-200">{notice}</div>
          ) : null}
        </div>

        <div className="card p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {dateOptions.map((iso) => (
              <button
                key={iso}
                type="button"
                className={"btn-ghost justify-start " + (draft.date === iso ? "ring-2 ring-ink-300 bg-ink-50" : "")}
                onClick={() => updateDraft({ date: iso })}
              >
                {fmtDate(iso)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost w-full" type="button" onClick={() => go("/booking/step-1-service")}>
            Back
          </button>
          <button className="btn-primary w-full" type="button" disabled={!draft.date} onClick={() => go("/booking/step-3-time")}>
            Next
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <div className="text-lg font-semibold">Select Time</div>
          <div className="mt-2 text-sm text-slate-600">Available slots based on your nurse schedule.</div>
          <div className="mt-2 text-xs text-slate-600">Slots account for your selected services duration.</div>

          {notice ? (
            <div className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-800 ring-1 ring-ink-200">{notice}</div>
          ) : null}
        </div>

        <div className="card p-3">
          {timeOptions.length ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {timeOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={"btn-ghost " + (draft.time === t ? "ring-2 ring-ink-300 bg-ink-50" : "")}
                  onClick={() => updateDraft({ time: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-slate-600">No time slots found for that date. Try another day.</div>
          )}
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost w-full" type="button" onClick={() => go("/booking/step-2-date")}>
            Back
          </button>
          <button className="btn-primary w-full" type="button" disabled={!draft.time} onClick={() => go("/booking/step-4-details")}>
            Next
          </button>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <div className="text-lg font-semibold">Your Details</div>
          <div className="mt-2 text-sm text-slate-600">So we can contact you and arrive prepared.</div>

          {notice ? (
            <div className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-800 ring-1 ring-ink-200">{notice}</div>
          ) : null}
        </div>

        <div className="card p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Full Name</label>
            <input
              className="input mt-1"
              value={draft.fullName ?? ""}
              onChange={(e) => updateDraft({ fullName: e.target.value })}
              placeholder="Juan Dela Cruz"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Phone</label>
            <input
              className="input mt-1"
              value={draft.phone ?? ""}
              onChange={(e) => updateDraft({ phone: e.target.value })}
              placeholder="+63..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Email (optional)</label>
            <input
              className="input mt-1"
              value={draft.email ?? ""}
              onChange={(e) => updateDraft({ email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Address (optional)</label>
            <textarea
              className="input mt-1 min-h-20"
              value={draft.address ?? ""}
              onChange={(e) => updateDraft({ address: e.target.value })}
              placeholder="Unit / Street / Barangay / City"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost w-full" type="button" onClick={() => go("/booking/step-3-time")}>
            Back
          </button>
          <button
            className="btn-primary w-full"
            type="button"
            disabled={!draft.fullName || !draft.phone}
            onClick={() => go("/booking/step-5-confirmation")}
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  // step 5
  const summaryServiceNames =
    selectedServices.length > 0
      ? selectedServices.map((s) => s.name)
      : draft.serviceNames?.filter(Boolean) ??
        (primaryService?.name ? [primaryService.name] : draft.serviceName ? [draft.serviceName] : []);

  return (
    <div className="space-y-4">
      <PopSuccess show={showPop} />

      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-ink-50 ring-1 ring-ink-200">
            <span aria-hidden className="text-ink-700">
              ✓
            </span>
          </div>
          <div>
            <div className="text-lg font-semibold">Booking Confirmed</div>
            <div className="text-sm text-slate-600">Your appointment has been scheduled.</div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-sm font-semibold text-slate-900">Summary</div>

        <div className="mt-3 grid gap-2 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Client Name</span>
            <span className="font-medium">{draft.fullName ?? "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Phone</span>
            <span className="font-medium">{draft.phone ?? "—"}</span>
          </div>

          {draft.address ? (
            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-600">Address</span>
              <span className="text-right font-medium">{draft.address}</span>
            </div>
          ) : null}

          <div className="my-2 border-t border-slate-200" />

          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-600">Services</span>
            <span className="text-right font-medium">{summaryServiceNames.length ? summaryServiceNames.join(", ") : "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Total Duration</span>
            <span className="font-medium">{totalDurationMins ? `${totalDurationMins} mins` : "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Total Price</span>
            <span className="font-medium">{totalPriceXAF}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Date</span>
            <span className="font-medium">{draft.date ? fmtDate(draft.date) : "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">Time</span>
            <span className="font-medium">{draft.time ?? "—"}</span>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-600">
          We&apos;ll send a confirmation email if you provided one. If you need changes, contact the clinic.
        </div>
      </div>

      <button
        className="btn-primary w-full"
        type="button"
        disabled={
          submitting ||
          draft.submitted ||
          (draft.serviceIds?.length ?? 0) < 1 ||
          !draft.date ||
          !draft.time ||
          !draft.fullName ||
          !draft.phone
        }
        onClick={confirmBooking}
      >
        {draft.submitted ? "Submitted" : submitting ? "Finalizing..." : "Finish"}
      </button>

      <button
        className="btn-ghost w-full"
        type="button"
        onClick={() => {
          sessionStorage.removeItem(KEY);
          go("/");
        }}
      >
        Back to Home
      </button>
    </div>
  );
}
