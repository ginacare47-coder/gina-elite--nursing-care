import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/auth";

type Status = "Confirmed" | "Cancelled" | "Finished" | "Pending";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { id, status } = (await req.json()) as { id?: string; status?: Status };
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // update appointment
    const { data: updated, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select("id, full_name, phone, email, address, date, time, service_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // get service name
    let serviceName = "Service";
    if (updated?.service_id) {
      const { data: svc } = await supabase
        .from("services")
        .select("name")
        .eq("id", updated.service_id)
        .maybeSingle();
      if (svc?.name) serviceName = svc.name;
    }

    // trigger GAS webhook (optional)
    const hook = process.env.EMAIL_WEBHOOK_URL;
    if (hook) {
      try {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "status_changed",
            status,
            appointmentId: updated.id,
            serviceName,
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
