import nodemailer from "nodemailer";

function getConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user;
  return { host, port, user, pass, from };
}

export function isEmailConfigured() {
  const { host, user, pass } = getConfig();
  return Boolean(host && user && pass);
}

function createTransport() {
  const { host, port, user, pass } = getConfig();
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface PaymentConfirmationData {
  recipientEmail: string;
  recipientName: string;
  paymentReference: string;
  amount: string;
  packageName: string;
  invitationPath: string;
  /** Base URL for the invitation link, e.g. https://wedinstudio.replit.app */
  siteBaseUrl: string;
}

function formatAmount(amount: string) {
  const num = parseFloat(amount);
  if (!Number.isFinite(num)) return amount;
  return `RM ${num.toFixed(2)}`;
}

function buildHtml(data: PaymentConfirmationData) {
  const inviteUrl = `${data.siteBaseUrl}${data.invitationPath}`;
  const formattedAmount = formatAmount(data.amount);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Confirmed – Wedinstudio</title>
</head>
<body style="margin:0;padding:0;background:#f9f6f2;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#2c2c2c;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c9a96e;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Wedinstudio</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:normal;letter-spacing:1px;">Payment Confirmed</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;color:#555;font-size:16px;line-height:1.6;">
                Dear ${data.recipientName},
              </p>
              <p style="margin:0 0 24px;color:#555;font-size:16px;line-height:1.6;">
                Your payment has been received and your wedding invitation is now <strong>live</strong>. 🎉
              </p>

              <!-- Receipt box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:6px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;">Receipt</p>
                    <hr style="border:none;border-top:1px solid #e5e0d8;margin:12px 0;" />
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:14px;">Invoice Reference</td>
                        <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;font-family:monospace;">${data.paymentReference}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:14px;">Package</td>
                        <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;">${data.packageName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:14px;">Amount Paid</td>
                        <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;font-weight:bold;">${formattedAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <p style="margin:0 0 24px;color:#555;font-size:16px;line-height:1.6;">
                Your invitation is ready to be shared with your guests:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:#c9a96e;border-radius:4px;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;text-decoration:none;letter-spacing:0.5px;">
                      View My Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#aaa;font-size:13px;text-align:center;">Or copy this link:</p>
              <p style="margin:0 0 32px;font-size:12px;text-align:center;font-family:monospace;color:#777;word-break:break-all;">
                <a href="${inviteUrl}" style="color:#c9a96e;">${inviteUrl}</a>
              </p>

              <p style="margin:0;color:#aaa;font-size:13px;line-height:1.6;">
                If you have any questions, please reply to this email or contact our support team.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f0ebe3;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#bbb;font-size:12px;">© Wedinstudio · Your digital wedding invitation platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(data: PaymentConfirmationData) {
  const inviteUrl = `${data.siteBaseUrl}${data.invitationPath}`;
  const formattedAmount = formatAmount(data.amount);
  return [
    `Dear ${data.recipientName},`,
    "",
    "Your payment has been received and your wedding invitation is now live!",
    "",
    "Receipt",
    "-------",
    `Invoice Reference : ${data.paymentReference}`,
    `Package           : ${data.packageName}`,
    `Amount Paid       : ${formattedAmount}`,
    "",
    "View your invitation:",
    inviteUrl,
    "",
    "Wedinstudio · Your digital wedding invitation platform",
  ].join("\n");
}

/**
 * Send a payment confirmation email. Silently skips when SMTP is not configured.
 * Returns true if the email was sent, false if skipped, throws on send failure.
 */
export async function sendPaymentConfirmationEmail(
  data: PaymentConfirmationData,
): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const { from } = getConfig();
  const transporter = createTransport();

  await transporter.sendMail({
    from: `Wedinstudio <${from}>`,
    to: data.recipientEmail,
    subject: `Your invitation is live – ${data.paymentReference}`,
    text: buildText(data),
    html: buildHtml(data),
  });

  return true;
}
