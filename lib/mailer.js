'use strict';
// Sends via SMTP when configured in settings; otherwise records to the local
// outbox so the full email loop is still testable before SMTP is set up.
const db = require('./db');
const { id } = require('./util');

let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch { /* optional */ }

async function send({ to, subject, html, text, kind, meta }) {
  const settings = db.load('settings', {});
  const smtp = settings.smtp || {};
  const entry = {
    id: id('mail'), to, subject, kind: kind || 'generic',
    html, text: text || '', meta: meta || {},
    createdAt: Date.now(), status: 'outbox', error: null
  };

  if (smtp.host && smtp.user && nodemailer) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host, port: Number(smtp.port) || 465,
        secure: smtp.secure !== false,
        auth: { user: smtp.user, pass: smtp.pass }
      });
      await transporter.sendMail({
        from: smtp.from || `"${settings.store?.name || 'Store'}" <${smtp.user}>`,
        to, subject, html, text
      });
      entry.status = 'sent';
    } catch (e) {
      entry.status = 'failed';
      entry.error = String(e.message || e);
    }
  }

  const outbox = db.load('outbox', []);
  outbox.unshift(entry);
  if (outbox.length > 500) outbox.length = 500;
  db.save('outbox', outbox);
  return entry;
}

module.exports = { send };
