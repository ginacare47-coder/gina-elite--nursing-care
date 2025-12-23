// supabase/functions/send-appointment-email/index.ts
// Deploy with: supabase functions deploy send-appointment-email --no-verify-jwt

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Appointment = {
  id: string;
  status?: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  date?: string | null;
  time?: string | null;
  service_name?: string | null;
  service_id?: string | null;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Appointment | null;
  old_record: Appointment | null;
};

// ---------- helpers ----------
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function esc(s: unknown) {
  const str = String(s ?? "");
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function fmtWhen(date?: string | null, time?: string | null) {
  const parts = [];
  if (date) parts.push(date);
  if (time) parts.push(time);
  return parts.length ? parts.join(" • ") : "—";
}

function badge(status?: string | null) {
  const s = (status ?? "Update") as string;
  const styles: Record<string, { bg: string; fg: string; bd: string }> = {
    Pending: { bg: "#fff7ed", fg: "#9a3412", bd: "#fed7aa" },
    Confirmed: { bg: "#ecfeff", fg: "#155e75", bd: "#a5f3fc" },
    Cancelled: { bg: "#fff1f2", fg: "#9f1239", bd: "#fecdd3" },
    Finished: { bg: "#f0fdf4", fg: "#166534", bd: "#bbf7d0" },
    New: { bg: "#eff6ff", fg: "#1e40af", bd: "#bfdbfe" },
    Update: { bg: "#f8fafc", fg: "#0f172a", bd: "#e2e8f0" },
  };
  const st = styles[s] ?? styles.Update;
  return `<span style="display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;background:${st.bg};color:${st.fg};border:1px solid ${st.bd}">${esc(s)}</span>`;
}

function layout(opts: { title: string; subtitle: string; badgeHtml: string; bodyHtml: string; footer: string }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="padding:18px 20px;background:linear-gradient(135deg,#0f172a,#1e293b)">
        <div style="color:#e2e8f0;font-size:12px;letter-spacing:.04em;text-transform:uppercase">Nurse Home Care</div>
        <div style="margin-top:6px;color:#fff;font-size:22px;font-weight:700">${esc(opts.title)}</div>
        <div style="margin-top:6px;color:#cbd5e1;font-size:13px">${esc(opts.subtitle)}</div>
      </div>

      <div style="padding:14px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
        ${opts.badgeHtml}
      </div>

      <div style="padding:18px 20px">
        ${opts.bodyHtml}
      </div>

      <div style="padding:14px 20px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.4">
        ${esc(opts.footer)}
      </div>
    </div>
    <div style="max-width:640px;margin:10px auto 0;color:#94a3b8;font-size:11px;text-align:center">© ${new Date().getFullYear()} Nurse Home Care</div>
  </div>`;
}

function kv(label: string, value?: string | null) {
  const v = value ? value : "—";
  return `
  <div style="display:flex;gap:12px;justify-content:space-between;padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:10px;background:#fff">
    <div style="color:#64748b;font-size:12px;min-width:120px">${esc(label)}</div>
    <div style="color:#0f172a;font-size:13px;font-weight:600;text-align:right">${esc(v)}</div>
  </div>`;
}

// ---------- Resend ----------
async function resendSend(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY")!;
  const from = Deno.env.get("RESEND_FROM") || "Nurse Home Care <onboarding@resend.dev>";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend error: ${r.status} ${JSON.stringify(data)}`);
  return data;
}

// ---------- server ----------
serve(async (req) => {
  // CORS / health
  if (req.method === "OPTIONS") {
    return new Response("", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST,GET,OPTIONS" } });
  }
  if (req.method === "GET") return new Response("OK");

  // simple shared secret so random people can't spam your endpoint
  const hookSecret = Deno.env.get("HOOK_SECRET") || "";
  if (hookSecret) {
    const got = req.headers.get("x-hook-secret") || "";
    if (got !== hookSecret) return json({ ok: false, error: "unauthorized" }, 401);
  }

  try {
    const payload = (await req.json()) as WebhookPayload;

    const record = payload.record;
    const old = payload.old_record;

    if (!record) return json({ ok: true, ignored: true });

    const admins = (Deno.env.get("ADMIN_EMAILS") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const when = fmtWhen(record.date, record.time);
    const serviceName = record.service_name || "Nurse Service";

    // Decide: new appointment vs status update
    const isInsert = payload.type === "INSERT";
    const statusChanged =
      payload.type === "UPDATE" &&
      (record.status ?? null) !== (old?.status ?? null) &&
      ["Pending", "Confirmed", "Cancelled", "Finished"].includes(String(record.status ?? ""));

    if (!isInsert && !statusChanged) {
      return json({ ok: true, ignored: true });
    }

    // CLIENT email
    const clientTo = record.email || "";
    const clientSubject = isInsert
      ? `[Nurse Booking] Booking received: ${serviceName}`
      : `[Nurse Booking] Status update: ${record.status} (${serviceName})`;

    const clientTitle = isInsert ? "Booking Received" : "Appointment Update";
    const clientSubtitle = isInsert
      ? "We received your request and will confirm it shortly."
      : `Your appointment status is now ${String(record.status ?? "Updated")}.`;

    const clientBody =
      `<div style="margin:8px 0 10px 0;font-size:12px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:.05em">Summary</div>` +
      kv("Client Name", record.full_name ?? "") +
      kv("Phone", record.phone ?? "") +
      (record.address ? kv("Address", record.address) : "") +
      `<div style="height:8px"></div>` +
      kv("Service", serviceName) +
      kv("Date & Time", when) +
      (record.id ? `<div style="margin-top:8px;color:#64748b;font-size:12px">Reference: ${esc(record.id)}</div>` : "");

    const clientHtml = layout({
      title: clientTitle,
      subtitle: clientSubtitle,
      badgeHtml: badge(isInsert ? "Pending" : (record.status ?? "Update")),
      bodyHtml: clientBody,
      footer: "If you need changes, contact our clinic. Thank you for trusting us with your care.",
    });

    // ADMIN email
    const adminSubject = isInsert
      ? `[Nurse Booking] New appointment: ${record.full_name ?? "Client"}`
      : `[Nurse Booking] Status → ${record.status}: ${record.full_name ?? "Client"}`;

    const adminBody =
      `<div style="margin:8px 0 10px 0;font-size:12px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:.05em">Appointment</div>` +
      kv("Service", serviceName) +
      kv("Date & Time", when) +
      kv("Status", record.status ?? "Pending") +
      `<div style="height:8px"></div>` +
      `<div style="margin:8px 0 10px 0;font-size:12px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:.05em">Client</div>` +
      kv("Name", record.full_name ?? "") +
      kv("Phone", record.phone ?? "") +
      (record.email ? kv("Email", record.email) : "") +
      (record.address ? kv("Address", record.address) : "") +
      (record.id ? `<div style="margin-top:8px;color:#64748b;font-size:12px">Appointment ID: ${esc(record.id)}</div>` : "");

    const adminHtml = layout({
      title: "Admin Notification",
      subtitle: isInsert ? "A new booking was created." : `Status updated to ${String(record.status ?? "Updated")}.`,
      badgeHtml: badge(isInsert ? "New" : (record.status ?? "Update")),
      bodyHtml: adminBody,
      footer: "Tip: Open the admin portal to manage availability and appointments.",
    });

    const results: unknown[] = [];

    // send client (if present)
    if (clientTo) {
      results.push(await resendSend(clientTo, clientSubject, clientHtml));
    }

    // send admins
    for (const a of admins) {
      results.push(await resendSend(a, adminSubject, adminHtml));
    }

    return json({ ok: true, sentToClient: !!clientTo, admins: admins.length });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
