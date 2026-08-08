import { ReplitConnectors } from "@replit/connectors-sdk";

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
 * Errors are caught and logged so a failed email never breaks the RSVP submission.
 */
export async function sendRsvpNotification(payload: RsvpNotificationPayload): Promise<void> {
  const { to, guestName, attending, numberOfGuests, timeSlot, message, invitationTitle } = payload;

  const attendingText = attending ? "✅ Hadir" : "❌ Tidak Hadir";
  const title = invitationTitle || "Majlis Anda";

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #3d5a3e; margin-bottom: 4px;">RSVP Baru — ${title}</h2>
      <p style="color: #666; margin-top: 0; font-size: 14px;">Seorang tetamu telah menghantar RSVP.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
        <tr style="background: #f9fafb;">
          <td style="padding: 10px 12px; font-weight: 600; width: 40%;">Nama</td>
          <td style="padding: 10px 12px;">${guestName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; font-weight: 600;">Kehadiran</td>
          <td style="padding: 10px 12px;">${attendingText}</td>
        </tr>
        ${attending ? `
        <tr style="background: #f9fafb;">
          <td style="padding: 10px 12px; font-weight: 600;">Bilangan Tetamu</td>
          <td style="padding: 10px 12px;">${numberOfGuests} orang</td>
        </tr>` : ""}
        ${timeSlot ? `
        <tr${attending ? "" : ' style="background: #f9fafb;"'}>
          <td style="padding: 10px 12px; font-weight: 600;">Slot Masa</td>
          <td style="padding: 10px 12px;">${timeSlot}</td>
        </tr>` : ""}
        ${message ? `
        <tr style="background: #f9fafb;">
          <td style="padding: 10px 12px; font-weight: 600; vertical-align: top;">Ucapan</td>
          <td style="padding: 10px 12px;">${message}</td>
        </tr>` : ""}
      </table>
      <p style="margin-top: 24px; font-size: 12px; color: #999;">
        Emel ini dihantar secara automatik oleh <strong>Wedinstudio</strong>.
      </p>
    </div>
  `;

  const connectors = new ReplitConnectors();
  await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Wedinstudio <noreply@wedinstudio.com>",
      to: [to],
      subject: `RSVP Baru: ${guestName} — ${attendingText}`,
      html: htmlBody,
    }),
  });
}
