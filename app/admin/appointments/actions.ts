"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/auth";

type Status = "pending" | "confirmed" | "in_progress" | "cancelled" | "finished";

export async function setAppointmentStatus(appointmentId: string, status: Status) {
  await requireAdmin();
  const supabase = await supabaseServer();

  // Update status
  const { data: updated, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select("id, full_name, phone, email, address, date, time, service_id")
    .single();

  if (error) throw new Error(error.message);

  // ✅ Pull services from new join table first; fallback to legacy service_id
  let serviceNames: string[] = [];

  const { data: links } = await supabase
    .from("appointment_services")
    .select("service:services(name)")
    .eq("appointment_id", updated.id);

  const fromLinks = (links ?? [])
    .map((x: any) => x?.service?.name)
    .filter(Boolean) as string[];

  if (fromLinks.length) {
    serviceNames = fromLinks;
  } else if (updated?.service_id) {
    const { data: svc } = await supabase.from("services").select("name").eq("id", updated.service_id).maybeSingle();
    if (svc?.name) serviceNames = [svc.name];
  }

  if (!serviceNames.length) serviceNames = ["Nurse Service"];

  // Send emails via GAS
  const hook = process.env.EMAIL_WEBHOOK_URL;
  if (hook) {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "status_changed",
        status, // lowercase now
        appointmentId: updated.id,
        serviceNames, // array now
        date: updated.date,
        time: updated.time,
        fullName: updated.full_name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? null,
      }),
    });
  }

  return { ok: true };
}
