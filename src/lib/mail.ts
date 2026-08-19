import nodemailer from "nodemailer";

function getMailConfig() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim()?.replace(/\s+/g, "");
  const from =
    process.env.EMAIL_FROM?.trim() ||
    (user ? `Your Home <${user}>` : undefined);

  return { user, pass, from };
}

export function isMailConfigured() {
  const { user, pass } = getMailConfig();
  return Boolean(user && pass);
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const { user, pass, from } = getMailConfig();

  if (!user || !pass || !from) {
    throw new Error(
      "Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.",
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export async function sendVerificationCodeEmail(input: {
  to: string;
  name?: string | null;
  code: string;
}) {
  const greeting = input.name ? `Hi ${input.name},` : "Hi,";
  const subject = `${input.code} is your verification code from Your Home`;
  const text = `${greeting}

Your verification code for Your Home is: ${input.code}

This code expires in 15 minutes. If you did not create an account, you can ignore this email.

— Your Home`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 12px;color:#0b6e4f">Your Home</h2>
      <p style="margin:0 0 16px">${greeting}</p>
      <p style="margin:0 0 8px">Your verification code is:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:16px 0;color:#0b6e4f">${input.code}</p>
      <p style="margin:0 0 16px;color:#475569;font-size:14px">This code expires in 15 minutes.</p>
      <p style="margin:0;color:#64748b;font-size:12px">If you did not create an account, ignore this email.</p>
    </div>
  `;

  await sendMail({ to: input.to, subject, text, html });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  const greeting = input.name ? `Hi ${input.name},` : "Hi,";
  const subject = "Reset your Your Home password";
  const text = `${greeting}

We received a request to reset your Your Home password.

Open this link to choose a new password (expires in 1 hour):
${input.resetUrl}

If you did not ask for a reset, you can ignore this email.

— Your Home`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 12px;color:#0b6e4f">Your Home</h2>
      <p style="margin:0 0 16px">${greeting}</p>
      <p style="margin:0 0 16px">We received a request to reset your password.</p>
      <p style="margin:0 0 24px">
        <a href="${input.resetUrl}" style="display:inline-block;background:#0b6e4f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
          Reset password
        </a>
      </p>
      <p style="margin:0 0 12px;color:#475569;font-size:14px">This link expires in 1 hour.</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;word-break:break-all">${input.resetUrl}</p>
      <p style="margin:16px 0 0;color:#64748b;font-size:12px">If you did not ask for a reset, ignore this email.</p>
    </div>
  `;

  await sendMail({ to: input.to, subject, text, html });
}

export async function sendTeamInviteEmail(input: {
  to: string;
  ownerName: string;
  rolesLabel: string;
  joinUrl: string;
}) {
  const subject = `${input.ownerName} invited you to join their team on Your Home`;
  const text = `Hi,

${input.ownerName} invited you to join their professional team on Your Home.

Assigned access: ${input.rolesLabel}

Create your account (or sign in) and join the team using this link (expires in 7 days):
${input.joinUrl}

If you were not expecting this invitation, you can ignore this email.

— Your Home`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="margin:0 0 12px;color:#0b6e4f">Your Home</h2>
      <p style="margin:0 0 16px">Hi,</p>
      <p style="margin:0 0 16px">
        <strong>${input.ownerName}</strong> invited you to join their professional team.
      </p>
      <p style="margin:0 0 16px;color:#475569;font-size:14px">
        Assigned access: ${input.rolesLabel}
      </p>
      <p style="margin:0 0 24px">
        <a href="${input.joinUrl}" style="display:inline-block;background:#0b6e4f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
          Accept invitation
        </a>
      </p>
      <p style="margin:0 0 12px;color:#475569;font-size:14px">This link expires in 7 days.</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:12px;word-break:break-all">${input.joinUrl}</p>
      <p style="margin:16px 0 0;color:#64748b;font-size:12px">If you were not expecting this, ignore this email.</p>
    </div>
  `;

  await sendMail({ to: input.to, subject, text, html });
}
