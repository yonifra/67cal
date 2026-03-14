import { defineString } from 'firebase-functions/params';

const APP_URL = defineString('APP_URL', { default: 'https://67cal.com' });

interface TimeChangeContext {
  eventTitle: string;
  calendarTitle: string;
  actorName: string;
  previousStart: Date;
  newStart: Date;
  previousEnd: Date;
  newEnd: Date;
  calendarId: string;
  eventId: string;
}

interface CancelContext {
  eventTitle: string;
  calendarTitle: string;
  actorName: string;
  cancelReason?: string;
  calendarId: string;
  eventId: string;
}

function formatDateTime(date: Date, lang: string): string {
  return date.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(date: Date, lang: string): string {
  return date.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function wrapHtml(content: string, lang: string): string {
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
    ${content}
  </div>
  <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:16px;">67Cal</p>
</body>
</html>`;
}

export function buildTimeChangedEmail(ctx: TimeChangeContext, lang: string): { subject: string; html: string } {
  const appUrl = APP_URL.value();
  const eventUrl = `${appUrl}/${lang}/calendar/${ctx.calendarId}/event/${ctx.eventId}`;

  if (lang === 'he') {
    return {
      subject: `זמן "${ctx.eventTitle}" שונה`,
      html: wrapHtml(`
        <div style="padding:24px 24px 0;background:#fef3c7;border-bottom:1px solid #fde68a;">
          <h2 style="margin:0 0 8px;color:#92400e;font-size:18px;">⏰ זמן האירוע שונה</h2>
          <p style="margin:0 0 16px;color:#92400e;font-size:14px;">ע"י ${ctx.actorName} ב${ctx.calendarTitle}</p>
        </div>
        <div style="padding:24px;">
          <h3 style="margin:0 0 16px;font-size:16px;">${ctx.eventTitle}</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:8px 0;color:#71717a;width:80px;">לפני:</td>
              <td style="padding:8px 0;">
                <span style="text-decoration:line-through;color:#a1a1aa;">
                  ${formatDateTime(ctx.previousStart, 'he')} — ${formatTime(ctx.previousEnd, 'he')}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#71717a;">אחרי:</td>
              <td style="padding:8px 0;font-weight:600;">
                ${formatDateTime(ctx.newStart, 'he')} — ${formatTime(ctx.newEnd, 'he')}
              </td>
            </tr>
          </table>
          <a href="${eventUrl}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">צפייה באירוע</a>
        </div>`, 'he'),
    };
  }

  return {
    subject: `"${ctx.eventTitle}" time was changed`,
    html: wrapHtml(`
      <div style="padding:24px 24px 0;background:#fef3c7;border-bottom:1px solid #fde68a;">
        <h2 style="margin:0 0 8px;color:#92400e;font-size:18px;">⏰ Event Time Changed</h2>
        <p style="margin:0 0 16px;color:#92400e;font-size:14px;">by ${ctx.actorName} in ${ctx.calendarTitle}</p>
      </div>
      <div style="padding:24px;">
        <h3 style="margin:0 0 16px;font-size:16px;">${ctx.eventTitle}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#71717a;width:80px;">Before:</td>
            <td style="padding:8px 0;">
              <span style="text-decoration:line-through;color:#a1a1aa;">
                ${formatDateTime(ctx.previousStart, 'en')} — ${formatTime(ctx.previousEnd, 'en')}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#71717a;">After:</td>
            <td style="padding:8px 0;font-weight:600;">
              ${formatDateTime(ctx.newStart, 'en')} — ${formatTime(ctx.newEnd, 'en')}
            </td>
          </tr>
        </table>
        <a href="${eventUrl}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">View Event</a>
      </div>`, 'en'),
  };
}

export function buildCancelledEmail(ctx: CancelContext, lang: string): { subject: string; html: string } {
  const appUrl = APP_URL.value();
  const eventUrl = `${appUrl}/${lang}/calendar/${ctx.calendarId}/event/${ctx.eventId}`;

  if (lang === 'he') {
    const reasonBlock = ctx.cancelReason
      ? `<p style="margin:12px 0;padding:12px;background:#fef2f2;border-radius:6px;color:#991b1b;font-size:14px;"><strong>סיבה:</strong> ${ctx.cancelReason}</p>`
      : '';
    return {
      subject: `"${ctx.eventTitle}" בוטל`,
      html: wrapHtml(`
        <div style="padding:24px 24px 0;background:#fef2f2;border-bottom:1px solid #fecaca;">
          <h2 style="margin:0 0 8px;color:#991b1b;font-size:18px;">❌ האירוע בוטל</h2>
          <p style="margin:0 0 16px;color:#991b1b;font-size:14px;">ע"י ${ctx.actorName} ב${ctx.calendarTitle}</p>
        </div>
        <div style="padding:24px;">
          <h3 style="margin:0 0 16px;font-size:16px;text-decoration:line-through;color:#a1a1aa;">${ctx.eventTitle}</h3>
          ${reasonBlock}
          <a href="${eventUrl}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">צפייה באירוע</a>
        </div>`, 'he'),
    };
  }

  const reasonBlock = ctx.cancelReason
    ? `<p style="margin:12px 0;padding:12px;background:#fef2f2;border-radius:6px;color:#991b1b;font-size:14px;"><strong>Reason:</strong> ${ctx.cancelReason}</p>`
    : '';

  return {
    subject: `"${ctx.eventTitle}" was cancelled`,
    html: wrapHtml(`
      <div style="padding:24px 24px 0;background:#fef2f2;border-bottom:1px solid #fecaca;">
        <h2 style="margin:0 0 8px;color:#991b1b;font-size:18px;">❌ Event Cancelled</h2>
        <p style="margin:0 0 16px;color:#991b1b;font-size:14px;">by ${ctx.actorName} in ${ctx.calendarTitle}</p>
      </div>
      <div style="padding:24px;">
        <h3 style="margin:0 0 16px;font-size:16px;text-decoration:line-through;color:#a1a1aa;">${ctx.eventTitle}</h3>
        ${reasonBlock}
        <a href="${eventUrl}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">View Event</a>
      </div>`, 'en'),
  };
}
