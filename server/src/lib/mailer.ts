import { env } from '../env.js';

// TODO: STUB — wire Resend when email is implemented
export async function sendMail(_input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!env.RESEND_API_KEY) return;
}
