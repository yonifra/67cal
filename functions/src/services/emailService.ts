import * as nodemailer from 'nodemailer';
import { defineString } from 'firebase-functions/params';

const SMTP_HOST = defineString('SMTP_HOST', { default: '' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '587' });
const SMTP_USER = defineString('SMTP_USER', { default: '' });
const SMTP_PASS = defineString('SMTP_PASS', { default: '' });
const SMTP_FROM = defineString('SMTP_FROM', { default: '' });

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = SMTP_HOST.value();
  const port = parseInt(SMTP_PORT.value(), 10);
  const user = SMTP_USER.value();
  const pass = SMTP_PASS.value();

  if (!host || !user || !pass) {
    console.warn('SMTP not configured — skipping email send');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const t = getTransporter();
  if (!t) return;

  const from = SMTP_FROM.value() || SMTP_USER.value();

  await t.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}

export async function sendEmails(payloads: EmailPayload[]): Promise<void> {
  await Promise.all(
    payloads.map((p) =>
      sendEmail(p).catch((err) => {
        console.error(`Failed to send email to ${p.to}:`, err);
      })
    )
  );
}
