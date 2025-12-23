"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

type Avail = { id: string; day_of_week: number; start_time: string; end_time: string };
type Blocked = { id: string; date: string; note: string | null };

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AvailabilityManager() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [avail, setAvail] = useState<Avail[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [form, setForm] = useState({ dow: 1, start: "09:00", end: "17:00" });
  const [blockDate, setBlockDate] = useState("");
  const [blockNote, setBlockNote] = useState("");

  async function load() {
    const { data: a } = await supabase.from("availability").select("*").order("day_of_week", { ascending: true });
    setAvail((a ?? []) as any);

    const { data: b } = await supabase.from("blocked_dates").select("*").order("date", { ascending: true });
    setBlocked((b ?? []) as any);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function addSlot() {
    const { error } = await supabase.from("availability").insert({
      day_of_week: form.dow,
      start_time: form.start,
      end_time: form.end,
    });
    if (error) return alert(error.message);
    load();
  }

  async function deleteSlot(id: string) {
    const { error } = await supabase.from("availability").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  async function addBlocked() {
    if (!blockDate) return;
    const { error } = await supabase.from("blocked_dates").insert({ date: blockDate, note: blockNote || null });
    if (error) return alert(error.message);
    setBlockDate("");
    setBlockNote("");
    load();
  }

  async function deleteBlocked(id: string) {
    const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="text-lg font-semibold">Availability</div>
        <div className="mt-1 text-sm text-slate-600">Controls which time slots appear in the booking wizard.</div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <select className="input" value={form.dow} onChange={(e) => setForm((p) => ({ ...p, dow: Number(e.target.value) }))}>
            {DOW.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
          <input className="input" value={form.start} onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))} />
          <input className="input" value={form.end} onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))} />
          <button className="btn-primary" onClick={addSlot}>Add Slot</button>
        </div>
      </div>

      <div className="card p-3">
        <div className="overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left font-medium">Day</th>
                <th className="p-3 text-left font-medium">Start</th>
                <th className="p-3 text-left font-medium">End</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {avail.map((r) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="p-3 font-medium">{DOW[r.day_of_week]}</td>
                  <td className="p-3">{r.start_time}</td>
                  <td className="p-3">{r.end_time}</td>
                  <td className="p-3 text-right">
                    <button className="btn-ghost" onClick={() => deleteSlot(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!avail.length ? (
                <tr><td className="p-6 text-center text-slate-600" colSpan={4}>No availability slots.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-lg font-semibold">Blocked Dates</div>
        <div className="mt-1 text-sm text-slate-600">Hide specific dates (holidays, fully booked days, etc.).</div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <input className="input" type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
          <input className="input sm:col-span-2" placeholder="Note (optional)" value={blockNote} onChange={(e) => setBlockNote(e.target.value)} />
          <button className="btn-primary" onClick={addBlocked}>Add Date</button>
        </div>

        <div className="mt-4 card p-3">
          <div className="overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Note</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((r) => (
                  <tr key={r.id} className="border-t border-slate-200">
                    <td className="p-3 font-medium">{r.date}</td>
                    <td className="p-3 text-slate-600">{r.note ?? "—"}</td>
                    <td className="p-3 text-right">
                      <button className="btn-ghost" onClick={() => deleteBlocked(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!blocked.length ? (
                  <tr><td className="p-6 text-center text-slate-600" colSpan={3}>No blocked dates.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
