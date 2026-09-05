import { Resend } from 'resend';
import { env } from '../env.js';
import { ApiError } from './apiError.js';

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<void> {
  if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 'dummy') {
    const attachmentInfo = input.attachments
      ? ` | Attachments: ${input.attachments.map((a) => a.filename).join(', ')}`
      : '';
    console.log(`[Mock Mailer] Sent email to "${input.to}" | Subject: "${input.subject}"${attachmentInfo}`);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (error) {
    console.error(`[Mailer Error] Failed to send email to ${input.to}:`, error.message);
    throw ApiError.internal(error.message);
  }
}
