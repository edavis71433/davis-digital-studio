import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_KEY') || '';
const ERIC = 'eric@davisdigitalstudio.com';
const FROM = 'Davis Digital Studio <noreply@davisdigitalstudio.com>';
const PSI_KEY = 'AIzaSyBNBUiz_mbNeKhhxMMMTREMSvVXO5e1BgE';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendEmail(to: string, subject: string, html: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
}

function emailWrap(body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f0820;font-family:'Helvetica Neue',Arial,sans-serif;">${body}</body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.json();
    const { type } = body;

    // ── PSI PROXY — fetch PageSpeed data server-side, no CORS issues ──
    if (type === 'psi_fetch') {
      const { url } = body;
      if (!url) return new Response(JSON.stringify({ error: 'No URL provided' }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 400 });

      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo&category=accessibility&key=${PSI_KEY}`;

      try {
        const psiRes = await fetch(psiUrl, { signal: AbortSignal.timeout(45000) });
        const psiData = await psiRes.json();

        if (psiData.error) {
          return new Response(JSON.stringify({ error: psiData.error.message || 'PSI error', code: psiData.error.code }), {
            headers: { ...cors, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        return new Response(JSON.stringify({ data: psiData }), {
          headers: { ...cors, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (psiErr) {
        const isTimeout = psiErr instanceof Error && (psiErr.name === 'TimeoutError' || psiErr.message.includes('timeout'));
        return new Response(JSON.stringify({ error: isTimeout ? 'timeout' : 'fetch_failed', message: String(psiErr) }), {
          headers: { ...cors, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // ── AUDIT LEAD — from free site score tool on audit.html ──
    if (type === 'audit_lead') {
      const { clientName, clientEmail, meta = {} } = body;
      const { url, bizType, city, score, perf, seo, a11y, lcp, fcp, cls, tbt, topIssues = [], userConfirmHtml, notifyHtml, fallback } = meta;

      const scoreColor = score < 45 ? '#e05555' : score < 65 ? '#f0b429' : '#6abf69';

      // Notify Eric
      const ericHtml = notifyHtml || emailWrap(`
        <div style="max-width:580px;margin:0 auto;padding:32px 24px;">
          <a href="https://davisdigitalstudio.com" style="font-family:Georgia,serif;font-size:18px;color:#fff;text-decoration:none;display:block;margin-bottom:20px;">Davis<span style="color:#c4aee8;">Digital</span> Studio</a>
          <div style="background:#1e1338;border-radius:16px;padding:28px;">
            <div style="font-size:11px;color:#c4aee8;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">New Audit Lead</div>
            <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#fff;margin:0 0 18px;">${clientName}</h1>
            <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13px;">
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);width:80px;">Email</td><td><a href="mailto:${clientEmail}" style="color:#c4aee8;">${clientEmail}</a></td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);">URL</td><td><a href="${url}" style="color:#c4aee8;" target="_blank">${url}</a></td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);">Type</td><td style="color:#fff;">${bizType || '—'}</td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);">City</td><td style="color:#fff;">${city || '—'}</td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);">Source</td><td style="color:#fff;">${fallback ? 'heuristic fallback' : 'PageSpeed API'}</td></tr>
            </table>
            <div style="display:flex;gap:10px;margin-bottom:16px;">
              <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;text-align:center;"><div style="font-size:32px;font-weight:700;color:${scoreColor};">${score}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);">Overall</div></div>
              ${perf != null ? `<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;text-align:center;"><div style="font-size:20px;font-weight:600;color:${perf<50?'#e05555':perf<90?'#f0b429':'#6abf69'};">${perf}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);">Perf</div></div>` : ''}
              ${seo != null ? `<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;text-align:center;"><div style="font-size:20px;font-weight:600;color:${seo<50?'#e05555':seo<90?'#f0b429':'#6abf69'};">${seo}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);">SEO</div></div>` : ''}
              ${a11y != null ? `<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;text-align:center;"><div style="font-size:20px;font-weight:600;color:${a11y<50?'#e05555':a11y<90?'#f0b429':'#6abf69'};">${a11y}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);">A11y</div></div>` : ''}
            </div>
            ${lcp ? `<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:rgba(255,255,255,0.4);">LCP: ${lcp} &nbsp;·&nbsp; FCP: ${fcp||'—'} &nbsp;·&nbsp; CLS: ${cls||'—'} &nbsp;·&nbsp; TBT: ${tbt||'—'}</div>` : ''}
            ${topIssues.length ? `<div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase;">Top issues</div>${topIssues.map((i: any, n: number) => `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:rgba(255,255,255,0.5);"><span style="color:${i.sev==='high'?'#e05555':i.sev==='medium'?'#f0b429':'#6abf69'};font-weight:700;">${n+1}. </span>${i.title}</div>`).join('')}` : ''}
            <div style="text-align:center;margin-top:20px;">
              <a href="mailto:${clientEmail}" style="display:inline-block;background:#5b3fa0;color:#fff;font-size:13px;font-weight:600;padding:10px 22px;border-radius:100px;text-decoration:none;margin-right:8px;">Reply to lead →</a>
              <a href="${url}" target="_blank" style="display:inline-block;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;padding:10px 22px;border-radius:100px;text-decoration:none;">Visit site →</a>
            </div>
          </div>
        </div>
      `);

      await sendEmail(ERIC, `New Audit Lead: ${clientName} — ${score}/100`, ericHtml);

      // Confirm to visitor
      if (clientEmail && userConfirmHtml) {
        await sendEmail(clientEmail, `Your free site score for ${clientName}`, userConfirmHtml);
      }

      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 400 });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 500 });
  }
});
