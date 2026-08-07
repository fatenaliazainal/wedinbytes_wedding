import { ReplitConnectors } from "@replit/connectors-sdk";

const FROM_ADDRESS = "Wedinstudio <onboarding@resend.dev>";

interface RsvpEmailParams {
  guestEmail: string;
  guestName: string;
  attending: boolean;
  groomName: string;
  brideName: string;
  eventDate?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
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

function buildHtml(params: RsvpEmailParams): string {
  const { guestName, attending, groomName, brideName, eventDate, venueName, venueAddress } = params;
  const coupleNames = `${groomName} & ${brideName}`;
  const formattedDate = formatDate(eventDate);
  const statusColour = attending ? "#16a34a" : "#dc2626";
  const statusText = attending ? "✅ Attending" : "❌ Not Attending";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>RSVP Confirmation</title></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:100%;">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:32px;text-align:center;">
          <p style="margin:0 0 8px;color:#c9a96e;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Wedding Invitation</p>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:400;font-style:italic;">${coupleNames}</h1>
          ${formattedDate ? `<p style="margin:12px 0 0;color:#9ca3af;font-size:13px;">${formattedDate}</p>` : ""}
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Dear <strong style="color:#111827;">${guestName}</strong>,</p>
          <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.6;">
            Thank you for responding to the wedding invitation of <strong>${coupleNames}</strong>.
            Your RSVP has been successfully recorded.
          </p>
          <!-- Status badge -->
          <div style="background:#f9fafb;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">Your Response</p>
            <p style="margin:0;font-size:18px;font-weight:600;color:${statusColour};">${statusText}</p>
          </div>
          ${venueName ? `
          <!-- Event details -->
          <div style="border-top:1px solid #f3f4f6;padding-top:20px;">
            <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;">Event Details</p>
            <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">${venueName}</p>
            ${venueAddress ? `<p style="margin:0;font-size:13px;color:#6b7280;">${venueAddress}</p>` : ""}
          </div>` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">This confirmation was sent by Wedinstudio · <a href="https://wedinstudio.com" style="color:#c9a96e;text-decoration:none;">wedinstudio.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendRsvpConfirmationEmail(params: RsvpEmailParams): Promise<void> {
  const connectors = new ReplitConnectors();
  const { groomName, brideName, eventDate } = params;
  const coupleNames = `${groomName} & ${brideName}`;
  const formattedDate = formatDate(eventDate);
  const subject = formattedDate
    ? `RSVP Confirmation — ${coupleNames} (${formattedDate})`
    : `RSVP Confirmation — ${coupleNames}`;

  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [params.guestEmail],
      subject,
      html: buildHtml(params),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown");
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }
}
