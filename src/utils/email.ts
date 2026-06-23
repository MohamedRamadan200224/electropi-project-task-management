import { Resend } from 'resend';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env';

const resend = new Resend(ENV.RESEND_API_KEY);

function compileTemplate(templateName: string): handlebars.TemplateDelegate {
  const filePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
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

  await resend.emails.send({
    from: ENV.FROM_EMAIL,
    to,
    subject: 'Reset your ElectroPi PM password',
    html,
  });
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

  await resend.emails.send({
    from: ENV.FROM_EMAIL,
    to,
    subject: 'Your ElectroPi PM password was changed',
    html,
  });
}
