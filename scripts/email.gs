/**
 * Google Apps Script Email Webhook
 *
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 *
 * Then set NEXT_PUBLIC_EMAIL_WEBHOOK_URL to the Web App URL.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");

    if (body.type !== "booking_confirmed") {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, ignored: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var adminEmail = body.adminEmail || Session.getActiveUser().getEmail();

    var subjectClient = "Booking Confirmed: " + (body.serviceName || "Appointment");
    var subjectAdmin = "New Booking: " + (body.serviceName || "Appointment");

    var summaryLines = [
      "Service: " + (body.serviceName || ""),
      "Date: " + (body.date || ""),
      "Time: " + (body.time || ""),
      "Name: " + (body.fullName || ""),
      "Phone: " + (body.phone || ""),
      "Email: " + (body.email || ""),
      "Address: " + (body.address || ""),
      "Appointment ID: " + (body.appointmentId || "")
    ].join("\n");

    var html = "<div style='font-family:Arial,sans-serif;line-height:1.5'>" +
      "<h2 style='margin:0 0 12px 0'>Booking Confirmed</h2>" +
      "<p>Your appointment has been scheduled.</p>" +
      "<pre style='background:#f6f8fb;padding:12px;border-radius:10px;border:1px solid #e5e7eb'>" +
      summaryLines.replace(/</g,"&lt;").replace(/>/g,"&gt;") +
      "</pre>" +
      "</div>";

    // Client email (only if provided)
    if (body.email) {
      MailApp.sendEmail({
        to: body.email,
        subject: subjectClient,
        htmlBody: html
      });
    }

    // Admin notification
    if (adminEmail) {
      MailApp.sendEmail({
        to: adminEmail,
        subject: subjectAdmin,
        htmlBody: "<div style='font-family:Arial,sans-serif;line-height:1.5'>" +
          "<h2 style='margin:0 0 12px 0'>New Booking</h2>" +
          "<pre style='background:#f6f8fb;padding:12px;border-radius:10px;border:1px solid #e5e7eb'>" +
          summaryLines.replace(/</g,"&lt;").replace(/>/g,"&gt;") +
          "</pre>" +
          "</div>"
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
