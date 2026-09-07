import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "NUB Alumni Connect <no-reply@nub-alumni-connect.com>";

let resendClient;
function getResend() {
  if (!RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(RESEND_API_KEY);
  return resendClient;
}

function wrapper(innerHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NUB Alumni Connect</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <span style="font-size:20px;font-weight:800;color:#18181b;letter-spacing:-0.02em;">NUB <span style="color:#2563eb;">Bridge</span></span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:32px;border:1px solid #e4e4e7;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;font-size:12px;color:#71717a;">
              Northern University Bangladesh · Alumni Connect Network<br />
              You received this email because you have an account with NUB Bridge.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailVerificationHtml({ name, url, expiresInHours }) {
  return wrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;color:#18181b;">Verify your email</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.6;">
      Hi ${name || "there"},
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.6;">
      Thanks for creating your NUB Bridge account. To finish signing up, please confirm your
      email address by clicking the button below.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="border-radius:10px;background-color:#2563eb;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Verify email address</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.6;">
      If the button does not work, copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 20px;font-size:12px;color:#2563eb;word-break:break-all;">
      ${url}
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#71717a;">
      This link expires in ${expiresInHours || 1} hour${expiresInHours > 1 ? "s" : ""}. If you didn't
      request this, you can safely ignore this email.
    </p>
  `);
}

export async function sendVerificationEmail({ user, url, token }) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set. Verification email NOT sent for", user?.email, "\n  link:", url);
    return null;
  }
  const base = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const callbackURL = encodeURIComponent("/verify-email");
  const verifyUrl = `${base}/api/auth/verify-email?token=${token}&callbackURL=${callbackURL}`;
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: user?.email,
    subject: "Verify your email — NUB Bridge",
    html: emailVerificationHtml({ name: user?.name, url: verifyUrl }),
  });
  if (error) {
    console.error("[email] Resend error:", error);
  }
  return error ? null : true;
}