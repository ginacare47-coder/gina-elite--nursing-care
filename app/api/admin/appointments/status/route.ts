import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/auth";

type Status = "pending" | "confirmed" | "in_progress" | "cancelled" | "finished";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { id, status } = (await req.json()) as { id?: string; status?: Status };
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const allowed: Status[] = ["pending", "confirmed", "in_progress", "cancelled", "finished"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Update appointment status (NO legacy service_id)
    const { data: updated, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select("id, full_name, phone, email, address, date, time, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch service names via join table (multi-service)
    const { data: links, error: linksErr } = await supabase
      .from("appointment_services")
      .select("service:services!appointment_services_service_id_fkey(name)")
      .eq("appointment_id", updated.id);

    if (linksErr) {
      // Not fatal for status update; just proceed with fallback label
      // (Should not happen if RLS/admin is correct.)
    }

    const serviceNames =
      (links ?? [])
        .map((r: any) => r?.service?.name)
        .filter(Boolean) as string[];

    const serviceName = serviceNames.length ? serviceNames.join(", ") : "Service";

    // Optional: totals from view (if you created appointment_totals)
    let totals: { total_price_cents: number | null; total_duration_mins: number | null } | null = null;
    const { data: tot } = await supabase
      .from("appointment_totals")
      .select("total_price_cents, total_duration_mins")
      .eq("appointment_id", updated.id)
      .maybeSingle();

    if (tot) totals = tot as any;

    // Trigger webhook (optional)
    const hook = process.env.EMAIL_WEBHOOK_URL;
    if (hook) {
      try {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "status_changed",
            status: updated.status,
            appointmentId: updated.id,
            serviceName, // now multi-service label
            services: serviceNames, // extra detail if you want it
            totals, // includes total_price_cents + total_duration_mins (nullable)
            date: updated.date,
            time: updated.time,
            fullName: updated.full_name,
            phone: updated.phone,
            email: updated.email,
            address: updated.address,
            adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? null,
          }),
        });
      } catch {
        // ignore webhook failure so status update still succeeds
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unauthorized" }, { status: 401 });
  }
}
