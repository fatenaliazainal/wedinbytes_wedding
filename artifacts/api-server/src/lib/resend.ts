import { ReplitConnectors } from "@replit/connectors-sdk";

const FROM_ADDRESS = "Wedinstudio <onboarding@resend.dev>";

interface RsvpNotificationParams {
  ownerEmail: string;
  ownerName: string;
  guestName: string;
  attending: boolean;
  numberOfGuests: number;
  message?: string | null;
  groomName: string;
  brideName: string;
  eventDate?: string | null;
  dashboardUrl?: string;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-MY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function buildHtml(p: RsvpNotificationParams): string {
  const coupleNames = `${p.groomName} & ${p.brideName}`;
  const formattedDate = formatDate(p.eventDate);
  const statusColour = p.attending ? "#16a34a" : "#dc2626";
  const statusText = p.attending ? "✅ Attending" : "❌ Not Attending";
  const guestCount = p.attending ? ` (${p.numberOfGuests} pax)` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New RSVP Response</title></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:100%;">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:28px 32px;text-align:center;">
          <p style="margin:0 0 6px;color:#c9a96e;font-size:11px;letter-spacing:3px;text-transform:uppercase;">New RSVP Response</p>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:400;font-style:italic;">${coupleNames}</h1>
          ${formattedDate ? `<p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">${formattedDate}</p>` : ""}
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">Hi <strong style="color:#111827;">${p.ownerName}</strong>,</p>
          <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.6;">
            You have received a new RSVP response for your invitation.
          </p>
          <!-- Response card -->
          <div style="background:#f9fafb;border-radius:8px;padding:20px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:12px;">
                  <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">Guest Name</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${p.guestName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:12px;border-top:1px solid #f3f4f6;padding-top:12px;">
                  <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">Response</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${statusColour};">${statusText}${guestCount}</p>
                </td>
              </tr>
              ${p.message ? `
              <tr>
                <td style="border-top:1px solid #f3f4f6;padding-top:12px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">Message</p>
                  <p style="margin:0;font-size:13px;color:#4b5563;font-style:italic;">"${p.message}"</p>
                </td>
              </tr>` : ""}
            </table>
          </div>
          ${p.dashboardUrl ? `
          <div style="text-align:center;">
            <a href="${p.dashboardUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:600;">View Dashboard</a>
          </div>` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 36px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">Wedinstudio · <a href="https://wedinstudio.com" style="color:#c9a96e;text-decoration:none;">wedinstudio.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendRsvpOwnerNotification(params: RsvpNotificationParams): Promise<void> {
  const connectors = new ReplitConnectors();
  const coupleNames = `${params.groomName} & ${params.brideName}`;
  const statusLabel = params.attending ? "attending" : "not attending";
  const subject = `New RSVP: ${params.guestName} is ${statusLabel} — ${coupleNames}`;

  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [params.ownerEmail],
      subject,
      html: buildHtml(params),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown");
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }
}
