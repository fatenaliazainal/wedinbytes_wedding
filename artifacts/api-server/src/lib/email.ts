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

const SITE_URL = "https://wedinstudio.com";

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

  const attendingLabel = attending ? "Attending" : "Not Attending";

  // ── HTML version ──────────────────────────────────────────────────────────
  const rows: string[] = [];
  rows.push(row("Name", esc(guestName), true));
  rows.push(row("Attendance", attendingLabel, false));
  if (attending) rows.push(row("Number of Guests", `${numberOfGuests}`, true));
  if (timeSlot) rows.push(row("Time Slot", esc(timeSlot), attending ? false : true));
  if (message) rows.push(row("Message / Wishes", esc(message), true, true));

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:480px;width:100%;">

        <!-- header -->
        <tr>
          <td style="background:#3d5a3e;padding:28px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:2px;color:#a8c5a0;text-transform:uppercase;">Wedinstudio</p>
            <h1 style="margin:10px 0 0;font-size:22px;color:#ffffff;font-weight:600;line-height:1.3;">
              You've Received a New RSVP
            </h1>
          </td>
        </tr>

        <!-- intro -->
        <tr>
          <td style="padding:24px 32px 12px;">
            <p style="margin:0;font-size:15px;color:#444;line-height:1.6;">
              A guest has just responded to your wedding invitation${invitationTitle ? ` for <strong>${esc(invitationTitle)}</strong>` : ""}.
            </p>
          </td>
        </tr>

        <!-- guest details heading -->
        <tr>
          <td style="padding:0 32px 8px;">
            <p style="margin:0;font-size:11px;letter-spacing:1.5px;color:#3d5a3e;text-transform:uppercase;font-weight:700;">
              Guest Details
            </p>
          </td>
        </tr>

        <!-- detail table -->
        <tr>
          <td style="padding:0 32px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              ${rows.join("")}
            </table>
          </td>
        </tr>

        <!-- divider -->
        <tr><td style="height:1px;background:#f0f0f0;"></td></tr>

        <!-- footer -->
        <tr>
          <td style="padding:24px 32px 28px;text-align:center;">
            <p style="margin:0 0 6px;font-size:14px;color:#555;line-height:1.6;">
              Thank you for choosing Wedinstudio to be part of your special day.
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#555;">
              With love,<br>
              <strong style="color:#3d5a3e;">Wedinstudio</strong>
            </p>
            <a href="${SITE_URL}"
               style="display:inline-block;font-size:12px;color:#3d5a3e;text-decoration:none;border:1px solid #3d5a3e;border-radius:20px;padding:6px 18px;letter-spacing:0.5px;">
              wedinstudio.com
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:#bbb;">Digital Wedding Invitations</p>
          </td>
        </tr>

      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#aaa;">This email was sent automatically. Please do not reply.</p>
    </td></tr>
  </table>
</body>
</html>`;

  // ── Plain-text version (important for deliverability) ─────────────────────
  const textLines: string[] = [
    "You've Received a New RSVP",
    "─".repeat(40),
    "",
    `A guest has just responded to your wedding invitation${invitationTitle ? ` for ${invitationTitle}` : ""}.`,
    "",
    "Guest Details",
    `Name             : ${guestName}`,
    `Attendance       : ${attendingLabel}`,
  ];
  if (attending) textLines.push(`Number of Guests : ${numberOfGuests}`);
  if (timeSlot) textLines.push(`Time Slot        : ${timeSlot}`);
  if (message) textLines.push(`Message / Wishes :\n${message}`);
  textLines.push(
    "",
    "Thank you for choosing Wedinstudio to be part of your special day.",
    "",
    "With love,",
    "Wedinstudio",
    SITE_URL,
    "Digital Wedding Invitations",
    "",
    "This email was sent automatically. Please do not reply.",
  );
  const textBody = textLines.join("\n");

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: "Wedinstudio <noreply@wedinstudio.com>",
      replyTo: "noreply@wedinstudio.com",
      to: [to],
      subject: `You've Received a New RSVP — ${guestName}`,
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

export interface AdminEmailBlastPayload {
  to: string;
  subject: string;
  content: string;
  imageUrl?: string | null;
}

function buildAdminBlastHtml(payload: AdminEmailBlastPayload) {
  const image = payload.imageUrl
    ? `<img src="${esc(payload.imageUrl)}" alt="" style="display:block;width:100%;max-width:600px;height:auto;margin:0 auto 28px;border-radius:8px;" />`
    : "";
  const content = esc(payload.content).replace(/\r?\n/g, "<br />");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#3d5a3e;padding:28px 32px;">
          <p style="margin:0;font-size:11px;letter-spacing:2px;color:#a8c5a0;text-transform:uppercase;">Wedinstudio</p>
        </td></tr>
        <tr><td style="padding:32px;">
          ${image}
          <div style="font-size:16px;line-height:1.7;color:#333;">${content}</div>
        </td></tr>
        <tr><td style="background:#f7f7f5;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#999;">Wedinstudio · Digital Wedding Invitations</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendAdminEmailBlast(payload: AdminEmailBlastPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const imageUrl = payload.imageUrl
    ? payload.imageUrl.startsWith("/")
      ? `${SITE_URL}${payload.imageUrl}`
      : payload.imageUrl
    : null;
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Wedinstudio <noreply@wedinstudio.com>",
    replyTo: "noreply@wedinstudio.com",
    to: [payload.to],
    subject: payload.subject,
    html: buildAdminBlastHtml({ ...payload, imageUrl }),
    text: payload.content,
  });
  if (error) {
    throw new Error(error.message || "Resend rejected the email.");
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
