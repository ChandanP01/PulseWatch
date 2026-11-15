import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/env.js';

let transporter: Transporter | null = null;
let isEthereal = false;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (config.smtp.host && config.smtp.user) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    console.log('[EmailService] Configured with custom SMTP server:', config.smtp.host);
  } else {
    // Zero-config fallback: create test Ethereal account or direct console logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isEthereal = true;
      console.log('[EmailService] Using Ethereal sandbox test email account for alerts.');
    } catch {
      // Direct console mock transporter
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
        buffer: true,
      });
      console.log('[EmailService] Operating in console stream mode.');
    }
  }

  return transporter;
}

export interface AlertEmailPayload {
  to: string | string[];
  monitorName: string;
  url: string;
  statusCode?: number;
  cause?: string;
  startedAt?: Date;
  durationSeconds?: number;
}

export async function sendDowntimeAlert(payload: AlertEmailPayload): Promise<void> {
  try {
    const client = await getTransporter();
    const recipients = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
    if (!recipients) return;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #ef4444;">
        <div style="background: #ef4444; padding: 18px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">🔴 Incident Alert: ${payload.monitorName} is DOWN</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #cbd5e1; margin-top: 0;">PulseWatch has detected downtime for your monitored target.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Target URL:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #38bdf8;">${payload.url}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">Root Cause:</td>
              <td style="padding: 8px 0; color: #f87171; font-weight: bold;">${payload.cause}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">Detected At:</td>
              <td style="padding: 8px 0; color: #f8fafc;">${(payload.startedAt || new Date()).toUTCString()}</td>
            </tr>
          </table>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">Our monitoring engine will automatically notify you when the service recovers.</p>
        </div>
      </div>
    `;

    const info = await client.sendMail({
      from: config.smtp.from,
      to: recipients,
      subject: `🚨 [DOWN] ${payload.monitorName} is unreachable`,
      html,
    });

    console.log(`[Alert] Sent DOWN email alert for ${payload.monitorName} to ${recipients}`);
    if (isEthereal) {
      console.log(`[Alert] Ethereal preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error: any) {
    console.error('[Alert] Failed to send downtime email alert:', error.message);
  }
}

export async function sendRecoveryAlert(payload: AlertEmailPayload): Promise<void> {
  try {
    const client = await getTransporter();
    const recipients = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
    if (!recipients) return;

    const formattedDuration = payload.durationSeconds
      ? `${Math.floor(payload.durationSeconds / 60)}m ${payload.durationSeconds % 60}s`
      : 'under 1 minute';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #10b981;">
        <div style="background: #10b981; padding: 18px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">🟢 Recovery: ${payload.monitorName} is UP</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #cbd5e1; margin-top: 0;">Your monitored service has recovered and is responding normally.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Target URL:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #38bdf8;">${payload.url}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">Total Downtime:</td>
              <td style="padding: 8px 0; color: #34d399; font-weight: bold;">${formattedDuration}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">Resolved At:</td>
              <td style="padding: 8px 0; color: #f8fafc;">${new Date().toUTCString()}</td>
            </tr>
          </table>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">Incident has been marked resolved in PulseWatch.</p>
        </div>
      </div>
    `;

    const info = await client.sendMail({
      from: config.smtp.from,
      to: recipients,
      subject: `✅ [RECOVERED] ${payload.monitorName} is back UP`,
      html,
    });

    console.log(`[Alert] Sent RECOVERY email alert for ${payload.monitorName} to ${recipients}`);
    if (isEthereal) {
      console.log(`[Alert] Ethereal preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error: any) {
    console.error('[Alert] Failed to send recovery email alert:', error.message);
  }
}
