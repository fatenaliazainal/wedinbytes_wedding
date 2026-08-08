import { Resend } from "resend";

interface RsvpNotificationPayload {
  to: string;
  guestName: string;
  attending: boolean;
  numberOfGuests: number;
  timeSlot?: string | null;
  message?: string | null;
  invitationTitle?: string | null;
}

/**
 * Send an RSVP notification email to the couple's email address.
 * Reads RESEND_API_KEY from process.env — never exposed to the frontend.
 * Errors are caught so a failed email never breaks the RSVP submission.
 */
export async function sendRsvpNotification(payload: RsvpNotificationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping RSVP notification email");
    return;
  }

  const { to, guestName, attending, numberOfGuests, timeSlot, message, invitationTitle } = payload;

  const attendingLabel = attending ? "Hadir" : "Tidak Hadir";
  const title = invitationTitle || "Majlis Anda";

  // ── HTML version ──────────────────────────────────────────────────────────
  const rows: string[] = [];
  rows.push(row("Nama", esc(guestName), true));
  rows.push(row("Kehadiran", attendingLabel, false));
  if (attending) rows.push(row("Bilangan Tetamu", `${numberOfGuests} orang`, true));
  if (timeSlot) rows.push(row("Slot Masa", esc(timeSlot), attending ? false : true));
  if (message) rows.push(row("Ucapan", esc(message), true, true));

  const htmlBody = `<!DOCTYPE html>
<html lang="ms">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:480px;width:100%;">
        <!-- header -->
        <tr>
          <td style="background:#3d5a3e;padding:24px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:2px;color:#a8c5a0;text-transform:uppercase;">Wedinstudio</p>
            <h1 style="margin:8px 0 0;font-size:20px;color:#ffffff;font-weight:600;">RSVP Baru Diterima</h1>
          </td>
        </tr>
        <!-- intro -->
        <tr>
          <td style="padding:24px 32px 8px;">
            <p style="margin:0;font-size:14px;color:#555;">
              Tetamu baru telah menghantar RSVP untuk <strong>${esc(title)}</strong>.
            </p>
          </td>
        </tr>
        <!-- table -->
        <tr>
          <td style="padding:8px 32px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              ${rows.join("")}
            </table>
          </td>
        </tr>
        <!-- footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              Emel ini dihantar secara automatik oleh sistem Wedinstudio.
              Sila jangan balas emel ini.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── Plain-text version (important for deliverability) ─────────────────────
  const textLines: string[] = [
    `RSVP Baru — ${title}`,
    `${"─".repeat(40)}`,
    `Nama        : ${guestName}`,
    `Kehadiran   : ${attendingLabel}`,
  ];
  if (attending) textLines.push(`Bil. Tetamu : ${numberOfGuests} orang`);
  if (timeSlot) textLines.push(`Slot Masa   : ${timeSlot}`);
  if (message) textLines.push(`Ucapan      :\n${message}`);
  textLines.push("", "Emel ini dihantar secara automatik oleh Wedinstudio.");
  const textBody = textLines.join("\n");

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: "Wedinstudio <noreply@wedinstudio.com>",
      reply_to: "noreply@wedinstudio.com",
      to: [to],
      subject: `RSVP: ${guestName} — ${attendingLabel} | ${title}`,
      html: htmlBody,
      text: textBody,
    });
    if (error) {
      console.error("[email] Resend API error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send RSVP notification:", err);
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function row(label: string, value: string, shaded: boolean, valignTop = false): string {
  const bg = shaded ? "background:#f9fafb;" : "";
  const va = valignTop ? "vertical-align:top;" : "";
  return `<tr style="${bg}">
    <td style="padding:10px 14px;font-weight:600;color:#374151;width:38%;${va}">${label}</td>
    <td style="padding:10px 14px;color:#111;${va}">${value}</td>
  </tr>`;
}
