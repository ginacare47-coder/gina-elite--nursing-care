"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_mins: number;
  is_active: boolean;
};

function formatXAF(priceCents: number) {
  // Assumes your DB stores "cents-like" integers (price * 100).
  // Display XAF as whole units (no decimals).
  const amount = Math.round(priceCents / 100);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ServicesManager() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "0", duration: "30" });

  async function load() {
    const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    if (error) alert(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addService() {
    setBusy(true);
    const { error } = await supabase.from("services").insert({
      name: form.name,
      description: form.description || null,
      // Keep storage the same (price * 100). Only UI display changes to XAF.
      price_cents: Math.round(Number(form.price) * 100),
      duration_mins: Number(form.duration),
      is_active: true,
    });
    setBusy(false);
    if (error) return alert(error.message);
    setForm({ name: "", description: "", price: "0", duration: "30" });
    load();
  }

  async function toggleActive(id: string, next: boolean) {
    const { error } = await supabase.from("services").update({ is_active: next }).eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Manage Services</div>
            <div className="text-sm text-slate-600">CRUD services shown in the public booking wizard.</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <input
            className="input sm:col-span-1"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />

          <input
            className="input sm:col-span-1"
            placeholder="Price (XAF)"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          />

          <input
            className="input sm:col-span-1"
            placeholder="Duration (mins)"
            value={form.duration}
            onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
          />

          <button className="btn-primary sm:col-span-1" disabled={busy || !form.name} onClick={addService}>
            Add
          </button>

          <textarea
            className="input sm:col-span-4"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
      </div>

      <div className="card p-3">
        <div className="overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left font-medium">Service</th>
                <th className="p-3 text-left font-medium">Price</th>
                <th className="p-3 text-left font-medium">Duration</th>
                <th className="p-3 text-left font-medium">Active</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    {r.description ? <div className="text-xs text-slate-600">{r.description}</div> : null}
                  </td>

                  <td className="p-3">{formatXAF(r.price_cents)}</td>

                  <td className="p-3">{r.duration_mins} mins</td>
                  <td className="p-3">{r.is_active ? "Yes" : "No"}</td>

                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-ghost" onClick={() => toggleActive(r.id, !r.is_active)}>
                        {r.is_active ? "Disable" : "Enable"}
                      </button>
                      <button className="btn-ghost" onClick={() => remove(r.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td className="p-6 text-center text-slate-600" colSpan={5}>
                    No services yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
