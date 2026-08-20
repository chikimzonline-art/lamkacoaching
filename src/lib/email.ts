import { env } from 'process';

export function generateSecurePassword(): string {
  // Characters excluding ambiguous ones like 0, O, I, l, 1
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';

  // Ensure at least one from each group
  let password = [
    upper.charAt(Math.floor(Math.random() * upper.length)),
    lower.charAt(Math.floor(Math.random() * lower.length)),
    digits.charAt(Math.floor(Math.random() * digits.length)),
    special.charAt(Math.floor(Math.random() * special.length)),
  ];

  const allChars = upper + lower + digits + lower + digits;
  for (let i = 0; i < 4; i++) {
    password.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
  }

  // Shuffle array
  return password.sort(() => Math.random() - 0.5).join('');
}

export function generateUsernameSlug(name: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .join('.');

  return clean || 'student';
}

interface SendCredentialsParams {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  portalUrl?: string;
}

interface SendReceiptParams {
  name: string;
  email: string;
  receiptNo?: string | null;
  amount: number;
  mode: string;
  paymentType: 'booking' | 'enrollment';
  itemTitle: string;
  paidAt: string;
}

export async function sendStudentCredentialsEmail({
  name,
  email,
  phone,
  username,
  password,
  portalUrl,
}: SendCredentialsParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_NOREPLY_EMAIL || 'noreply@lamkacoaching.in';
  const senderName = process.env.BREVO_SENDER_NAME || 'Lamka Coaching Center';
  const loginUrl = portalUrl || `${process.env.NEXTAUTH_URL || 'https://lamkacoaching.in'}/login`;

  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY is not configured in .env. Skipping email dispatch.');
    return { success: false, error: 'Brevo API key is not configured' };
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Lamka Coaching Center</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f1f5f9;color:#1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -2px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg, #0891b2 0%, #0284c7 100%);padding:32px 28px;text-align:center;">
              <h1 style="color:#ffffff;margin:0 0 6px 0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Lamka Coaching Center</h1>
              <p style="color:#e0f2fe;margin:0;font-size:14px;">Student Portal Login Credentials</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;">Dear <strong>${name}</strong>,</p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:22px;">
                Welcome to Lamka Coaching Center! Your student account has been successfully created. You can now access your learning materials, study cabin bookings, attendance records, and payment history.
              </p>

              <!-- Credentials Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;margin:0 0 24px 0;padding:18px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;color:#0891b2;text-transform:uppercase;letter-spacing:0.5px;">Your Login Credentials</p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="4">
                      <tr>
                        <td width="35%" style="font-size:13px;color:#64748b;font-weight:500;">Phone / Username:</td>
                        <td style="font-size:14px;color:#0f172a;font-weight:700;">${phone} <span style="font-size:12px;color:#64748b;font-weight:normal;">(@${username})</span></td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;font-weight:500;">Password:</td>
                        <td style="font-size:15px;color:#0369a1;font-weight:700;font-family:monospace;letter-spacing:1px;background:#e0f2fe;padding:2px 8px;border-radius:4px;display:inline-block;">${password}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;font-weight:500;">Login Portal:</td>
                        <td style="font-size:13px;color:#0284c7;">${loginUrl}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Login CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 24px 0;text-align:center;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="background-color:#0891b2;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;display:inline-block;box-shadow:0 2px 4px rgba(8,145,178,0.3);">
                      Log In to Student Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;line-height:20px;">
                <em>Tip: You can log in using either your Phone number (${phone}), your Email (${email}), or your username (@${username}). You will also be prompted to set your own permanent password upon logging in.</em>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 28px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#64748b;">
                Lamka Coaching Center &bull; Lamka, Churachandpur, Manipur
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                This is an automated system notification from noreply@lamkacoaching.in.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email,
            name,
          },
        ],
        subject: `Welcome to Lamka Coaching - Your Portal Login Credentials`,
        htmlContent,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('[Brevo] Error dispatching credentials email:', json);
      return { success: false, error: json.message || 'Brevo API error' };
    }

    return { success: true, messageId: json.messageId };
  } catch (err) {
    console.error('[Brevo] Network error dispatching credentials email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function sendPaymentReceiptEmail({
  name,
  email,
  receiptNo,
  amount,
  mode,
  paymentType,
  itemTitle,
  paidAt,
}: SendReceiptParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_ADMIN_EMAIL || 'admin@lamkacoaching.in';
  const senderName = process.env.BREVO_SENDER_NAME || 'Lamka Coaching Center';
  const replyTo = process.env.BREVO_ADMIN_EMAIL || 'admin@lamkacoaching.in';

  if (!apiKey) {
    return { success: false, error: 'Brevo API key is not configured' };
  }

  const formattedAmount = `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  const displayReceiptNo = receiptNo || `RCPT-${paidAt.slice(0, 10).replace(/-/g, '')}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - Lamka Coaching Center</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f1f5f9;color:#1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg, #0891b2 0%, #0284c7 100%);padding:28px;text-align:center;">
              <h1 style="color:#ffffff;margin:0 0 4px 0;font-size:20px;">Lamka Coaching Center</h1>
              <p style="color:#e0f2fe;margin:0;font-size:13px;">Official Payment Receipt</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px 0;font-size:15px;">Dear <strong>${name}</strong>,</p>
              <p style="margin:0 0 20px 0;font-size:14px;color:#475569;">
                Thank you for your payment. This is your official receipt for the transaction.
              </p>

              <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:0 0 20px 0;font-size:13px;">
                <tr>
                  <td style="color:#64748b;">Receipt No:</td>
                  <td style="font-weight:700;color:#0f172a;text-align:right;">${displayReceiptNo}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;">Item / Description:</td>
                  <td style="font-weight:600;color:#0f172a;text-align:right;">${itemTitle}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;">Payment Date:</td>
                  <td style="color:#0f172a;text-align:right;">${paidAt}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;">Payment Mode:</td>
                  <td style="color:#0f172a;text-align:right;text-transform:uppercase;">${mode}</td>
                </tr>
                <tr style="border-top:1px solid #cbd5e1;">
                  <td style="font-size:15px;font-weight:700;color:#0f172a;padding-top:12px;">Amount Paid:</td>
                  <td style="font-size:16px;font-weight:700;color:#0891b2;text-align:right;padding-top:12px;">${formattedAmount}</td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#64748b;">
                If you have any questions regarding this receipt, simply reply to this email to reach our administration team at <a href="mailto:${replyTo}" style="color:#0284c7;">${replyTo}</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
              Lamka Coaching Center &bull; All Rights Reserved
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        replyTo: { name: senderName, email: replyTo },
        to: [{ email, name }],
        subject: `Payment Receipt: ${itemTitle} (${formattedAmount})`,
        htmlContent,
      }),
    });

    const json = await res.json();
    return { success: res.ok, messageId: json.messageId };
  } catch (err) {
    console.error('[Brevo] Error dispatching receipt email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
