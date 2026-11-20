import { Resend } from 'resend';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env';
import { AppError } from './AppError';

// The Resend client is built lazily, only when an email is actually sent.
// Constructing it at module load (`new Resend('')`) throws "Missing API
// key" when RESEND_API_KEY is empty, which took the whole app down at
// boot — signup, login and everything else died with it, even though
// signup never sends an email. With this, the app boots and signup works
// with no email provider configured; only the password-reset emails fail,
// with a clear 500, when the key is missing.
function getResend(): Resend {
  if (!ENV.RESEND_API_KEY) {
    throw new AppError(
      'Email service is not configured (RESEND_API_KEY is not set)',
      500,
    );
  }
  return new Resend(ENV.RESEND_API_KEY);
}

function compileTemplate(templateName: string): handlebars.TemplateDelegate {
  // __dirname, not process.cwd(): the app must find its templates no matter
  // which directory it is started from. Works both from src/ (ts-node) and
  // dist/ (compiled), since both sit two levels below the repo root.
  const filePath = path.join(__dirname, '..', '..', 'templates', `${templateName}.hbs`);
  const source = fs.readFileSync(filePath, 'utf-8');
  return handlebars.compile(source);
}

const forgotPasswordTpl = compileTemplate('forgot-password');
const resetSuccessTpl = compileTemplate('reset-password-success');

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  rawToken: string,
): Promise<void> {
  const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${rawToken}`;
  const html = forgotPasswordTpl({
    name,
    email: to,
    token: rawToken,
    resetUrl,
    expiresInMinutes: ENV.RESET_TOKEN_EXPIRES_MINUTES,
  });

  // Resend does not throw on API failure — it returns { data, error }.
  // The old code ignored the return value, so forgotPassword could report
  // success when no email was sent. Throw instead.
  const { error } = await getResend().emails.send({
    from: ENV.FROM_EMAIL,
    to,
    subject: 'Reset your ElectroPi PM password',
    html,
  });
  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

export async function sendPasswordResetSuccessEmail(
  to: string,
  name: string,
): Promise<void> {
  const html = resetSuccessTpl({
    name,
    email: to,
    changedAt: new Date().toUTCString(),
  });

  const { error } = await getResend().emails.send({
    from: ENV.FROM_EMAIL,
    to,
    subject: 'Your ElectroPi PM password was changed',
    html,
  });
  if (error) {
    throw new Error(`Failed to send password reset confirmation email: ${error.message}`);
  }
}
