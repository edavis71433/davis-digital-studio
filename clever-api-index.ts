import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_KEY = Deno.env.get('RESEND_KEY') || '';
const ERIC = 'eric@davisdigitalstudio.com';
const FROM = 'Davis Digital Studio <noreply@davisdigitalstudio.com>';
const PSI_KEY = 'AIzaSyBNBUiz_mbNeKhhxMMMTREMSvVXO5e1BgE';

// Service-role key + project URL for privileged server-side calls (creating auth users).
// These MUST be set as Edge Function secrets in Supabase (see deploy notes).
const SB_URL = Deno.env.get('SUPABASE_URL') || 'https://qksstlqzbhesadrrofgn.supabase.co';
const SB_SERVICE = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { ...cors, 'Content-Type': 'application/json' },
    status,
  });
}

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

// A small branded shell for notification emails.
function notifyShell(heading: string, lines: string[], cta?: { label: string; href: string }) {
  return emailWrap(`
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <a href="https://davisdigitalstudio.com" style="font-family:Georgia,serif;font-size:18px;color:#fff;text-decoration:none;display:block;margin-bottom:20px;">Davis<span style="color:#c4aee8;">Digital</span> Studio</a>
      <div style="background:#1e1338;border-radius:16px;padding:28px;">
        <h1 style="font-family:Georgia,serif;font-size:21px;font-weight:400;color:#fff;margin:0 0 14px;">${heading}</h1>
        ${lines.map(l => `<p style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.6;margin:0 0 10px;">${l}</p>`).join('')}
        ${cta ? `<div style="text-align:center;margin-top:20px;"><a href="${cta.href}" style="display:inline-block;background:#5b3fa0;color:#fff;font-size:13px;font-weight:600;padding:11px 24px;border-radius:100px;text-decoration:none;">${cta.label}</a></div>` : ''}
      </div>
    </div>
  `);
}

// ── DEEP AUDIT ─────────────────────────────────────────────────────────────
async function deepAudit(targetUrl: string) {
  const out: any = {
    url: targetUrl, domain: '', https: false, fetchedHtml: false,
    onPage: { title: '', titleLength: 0, metaDescription: '', metaDescriptionLength: 0, canonical: null, h1Count: 0, h1Text: '', h2Count: 0, h3Count: 0, ogTitle: false, ogDescription: false, ogImage: false, ogUrl: false, twitterCard: false, wordCount: 0, imageCount: 0, imagesWithAlt: 0, internalLinks: 0, externalLinks: 0, favicon: false, langAttr: false },
    schema: { blocks: 0, types: [] as string[], hasLocalBusiness: false, hasOrganization: false, hasWebSite: false, hasBreadcrumb: false, localBusinessNAP: null as any },
    local: { phoneOnPage: false, phone: null as string | null, zipOnPage: false, googleMapsEmbed: false, hoursMentioned: false, socialLinks: [] as string[] },
    discoverability: { robotsTxt: false, robotsTxtBlocksAll: false, sitemapDeclared: false, sitemapUrl: null as string | null, sitemapXml: false, sitemapUrlCount: 0 },
  };

  let u: URL;
  try { u = new URL(targetUrl); } catch { return out; }
  out.domain = u.hostname;
  out.https = u.protocol === 'https:';

  let html = '';
  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DDS-Audit-Bot/1.0; +https://davisdigitalstudio.com)' },
      signal: AbortSignal.timeout(15000), redirect: 'follow',
    });
    if (res.ok) { html = await res.text(); out.fetchedHtml = true; }
  } catch (_) { /* ignore */ }

  if (html) {
    const lc = html.toLowerCase();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) { out.onPage.title = titleMatch[1].replace(/\s+/g, ' ').trim(); out.onPage.titleLength = out.onPage.title.length; }
    const md1 = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const md2 = html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const desc = md1 ? md1[1] : (md2 ? md2[1] : '');
    out.onPage.metaDescription = desc; out.onPage.metaDescriptionLength = desc.length;
    const can = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    out.onPage.canonical = can ? can[1] : null;
    out.onPage.h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    out.onPage.h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    out.onPage.h3Count = (html.match(/<h3[\s>]/gi) || []).length;
    const h1Text = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    out.onPage.h1Text = h1Text ? h1Text[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200) : '';
    out.onPage.ogTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
    out.onPage.ogDescription = /<meta[^>]+property=["']og:description["']/i.test(html);
    out.onPage.ogImage = /<meta[^>]+property=["']og:image["']/i.test(html);
    out.onPage.ogUrl = /<meta[^>]+property=["']og:url["']/i.test(html);
    out.onPage.twitterCard = /<meta[^>]+name=["']twitter:card["']/i.test(html);
    out.onPage.favicon = /<link[^>]+rel=["'](?:shortcut |icon|apple-touch-icon)/i.test(html);
    out.onPage.langAttr = /<html[^>]+lang=/i.test(html);
    const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
    const bodyText = (bodyMatch ? bodyMatch[0] : html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();
    out.onPage.wordCount = bodyText ? bodyText.split(/\s+/).length : 0;
    const imgs = html.match(/<img[^>]*>/gi) || [];
    out.onPage.imageCount = imgs.length;
    out.onPage.imagesWithAlt = imgs.filter(t => /\salt=["'][^"']/.test(t)).length;
    const anchors = html.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
    const host = u.hostname.replace(/^www\./, '');
    let internal = 0, external = 0;
    for (const a of anchors) {
      const href = (a.match(/href=["']([^"']+)["']/i) || [])[1] || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      if (href.startsWith('/') || href.startsWith('?') || href.toLowerCase().includes(host)) internal++;
      else if (/^https?:\/\//i.test(href)) external++;
    }
    out.onPage.internalLinks = internal; out.onPage.externalLinks = external;
    const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const schemas: any[] = [];
    for (const m of blocks) {
      try {
        const parsed = JSON.parse(m[1].trim());
        if (Array.isArray(parsed)) schemas.push(...parsed);
        else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) schemas.push(...parsed['@graph']);
        else schemas.push(parsed);
      } catch (_) { /* skip */ }
    }
    out.schema.blocks = blocks.length;
    const typeStrs: string[] = [];
    for (const s of schemas) {
      if (!s || !s['@type']) continue;
      if (Array.isArray(s['@type'])) typeStrs.push(...s['@type']); else typeStrs.push(s['@type']);
    }
    out.schema.types = [...new Set(typeStrs)];
    const LB = /LocalBusiness|Restaurant|Store|Bar|CafeOrCoffeeShop|FoodEstablishment|BarOrPub|HealthAndBeautyBusiness|HomeAndConstructionBusiness|MedicalBusiness|ProfessionalService|RealEstateAgent|LegalService|Dentist|HairSalon|DaySpa/i;
    out.schema.hasLocalBusiness = typeStrs.some(t => LB.test(t));
    out.schema.hasOrganization = typeStrs.includes('Organization');
    out.schema.hasWebSite = typeStrs.includes('WebSite');
    out.schema.hasBreadcrumb = typeStrs.includes('BreadcrumbList');
    const lbSchema = schemas.find(s => s && (Array.isArray(s['@type']) ? s['@type'].some((t: string) => LB.test(t)) : LB.test(s['@type'] || '')));
    if (lbSchema) {
      out.schema.localBusinessNAP = {
        name: !!lbSchema.name, address: !!lbSchema.address, phone: !!lbSchema.telephone,
        hours: !!(lbSchema.openingHours || lbSchema.openingHoursSpecification), geo: !!lbSchema.geo,
        sameAs: !!(lbSchema.sameAs && (Array.isArray(lbSchema.sameAs) ? lbSchema.sameAs.length : 1)),
        image: !!lbSchema.image, priceRange: !!lbSchema.priceRange,
      };
    }
    const phone = bodyText.match(/(\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/);
    out.local.phoneOnPage = !!phone; out.local.phone = phone ? phone[0] : null;
    out.local.zipOnPage = /\b\d{5}(-\d{4})?\b/.test(bodyText);
    out.local.googleMapsEmbed = /maps\.google\.com\/maps|google\.com\/maps\/embed|maps\.googleapis|google\.com\/maps\?/i.test(html);
    out.local.hoursMentioned = /\b(mon|tue|wed|thu|fri|sat|sun)(day)?\b[\s\S]{0,40}\d{1,2}\s*(am|pm|:)/i.test(bodyText);
    const socials = ['facebook.com','instagram.com','twitter.com','x.com','linkedin.com','youtube.com','tiktok.com','yelp.com','pinterest.com'];
    for (const p of socials) if (lc.includes(p)) out.local.socialLinks.push(p);
  }

  try {
    const rRes = await fetch(`${u.protocol}//${u.hostname}/robots.txt`, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DDS-Audit-Bot/1.0)' } });
    if (rRes.ok) {
      const rText = await rRes.text();
      out.discoverability.robotsTxt = true;
      out.discoverability.robotsTxtBlocksAll = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(rText);
      const sd = rText.match(/^Sitemap:\s*(\S+)/im);
      out.discoverability.sitemapDeclared = !!sd;
      out.discoverability.sitemapUrl = sd ? sd[1] : null;
    }
  } catch (_) { /* */ }

  try {
    const smUrl = out.discoverability.sitemapUrl || `${u.protocol}//${u.hostname}/sitemap.xml`;
    const sRes = await fetch(smUrl, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DDS-Audit-Bot/1.0)' } });
    if (sRes.ok) {
      const sText = await sRes.text();
      out.discoverability.sitemapXml = true;
      out.discoverability.sitemapUrlCount = (sText.match(/<url>/gi) || []).length || (sText.match(/<loc>/gi) || []).length;
    }
  } catch (_) { /* */ }

  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.json();
    const { type } = body;

    // ── PSI PROXY ──
    if (type === 'psi_fetch') {
      const { url } = body;
      if (!url) return json({ error: 'No URL provided' }, 400);
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo&category=accessibility&key=${PSI_KEY}`;
      try {
        const psiRes = await fetch(psiUrl, { signal: AbortSignal.timeout(90000) });
        const psiData = await psiRes.json();
        if (psiData.error) return json({ error: psiData.error.message || 'PSI error', code: psiData.error.code });
        return json({ data: psiData });
      } catch (psiErr) {
        const isTimeout = psiErr instanceof Error && (psiErr.name === 'TimeoutError' || psiErr.message.includes('timeout'));
        return json({ error: isTimeout ? 'timeout' : 'fetch_failed', message: String(psiErr) });
      }
    }

    // ── DEEP AUDIT ──
    if (type === 'deep_audit') {
      const { url } = body;
      if (!url) return json({ error: 'No URL provided' }, 400);
      try { return json({ data: await deepAudit(url) }); }
      catch (e) { return json({ error: 'deep_audit_failed', message: String(e) }); }
    }

    // ── CREATE CLIENT AUTH USER (privileged — service role) ──
    // The admin panel calls this instead of hitting /auth/v1/admin/users from the browser,
    // which the public anon key is not allowed to do.
    if (type === 'create_client_auth') {
      const { email, password } = body;
      if (!email || !password) return json({ error: 'email and password required' }, 400);
      if (!SB_SERVICE) return json({ error: 'Server missing SERVICE_ROLE_KEY secret' }, 500);
      try {
        const res = await fetch(`${SB_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SB_SERVICE, 'Authorization': `Bearer ${SB_SERVICE}` },
          body: JSON.stringify({ email, password, email_confirm: true }),
        });
        const data = await res.json();
        if (!res.ok) {
          return json({ error: data.msg || data.message || data.error_description || 'Could not create login', status: res.status }, 200);
        }
        return json({ ok: true, user_id: data.id || (data.user && data.user.id) || null });
      } catch (e) {
        return json({ error: 'auth_create_failed', message: String(e) }, 200);
      }
    }

    // ── AUDIT LEAD — persists to DB + sends emails ──
    if (type === 'audit_lead') {
      const { clientName, clientEmail, meta = {} } = body;
      const { url, bizType, city, score, perf, seo, a11y, lcp, fcp, cls, tbt, topIssues = [], userConfirmHtml, notifyHtml, fallback, pillars, deep, psiSkipped, tool } = meta;

      try {
        const key = SB_SERVICE || Deno.env.get('SUPABASE_ANON_KEY') || '';
        if (key) {
          await fetch(`${SB_URL}/rest/v1/audit_leads`, {
            method: 'POST',
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              tool: tool || 'audit', business_name: clientName || null, client_email: clientEmail || null,
              url: url || null, city: city || null, business_type: bizType || null,
              score: typeof score === 'number' ? score : null, pillars: pillars || null,
              core_web_vitals: (lcp || fcp || cls || tbt) ? { lcp, fcp, cls, tbt } : null,
              deep_audit: deep || null, findings: topIssues && topIssues.length ? topIssues : null,
              psi_skipped: !!psiSkipped,
            }),
          });
        }
      } catch (dbErr) { console.error('audit_leads insert failed (continuing with email):', dbErr); }

      const scoreColor = score < 45 ? '#e05555' : score < 65 ? '#f0b429' : '#6abf69';
      const ericHtml = notifyHtml || emailWrap(`
        <div style="max-width:580px;margin:0 auto;padding:32px 24px;">
          <a href="https://davisdigitalstudio.com" style="font-family:Georgia,serif;font-size:18px;color:#fff;text-decoration:none;display:block;margin-bottom:20px;">Davis<span style="color:#c4aee8;">Digital</span> Studio</a>
          <div style="background:#1e1338;border-radius:16px;padding:28px;">
            <div style="font-size:11px;color:#c4aee8;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">New Audit Lead</div>
            <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#fff;margin:0 0 4px;">${clientName}</h1>
            <a href="${url}" target="_blank" style="display:block;color:#c4aee8;text-decoration:none;font-size:13px;margin-bottom:18px;">${url}</a>
            <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13px;">
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);width:80px;">Email</td><td><a href="mailto:${clientEmail}" style="color:#c4aee8;">${clientEmail}</a></td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);">Type</td><td style="color:#fff;">${bizType || '—'}</td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);">City</td><td style="color:#fff;">${city || '—'}</td></tr>
              <tr><td style="padding:5px 0;color:rgba(255,255,255,0.4);">Source</td><td style="color:#fff;">${fallback ? 'heuristic fallback' : 'PSI + deep audit'}</td></tr>
            </table>
            <div style="display:flex;gap:10px;margin-bottom:16px;">
              <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;text-align:center;"><div style="font-size:32px;font-weight:700;color:${scoreColor};">${score}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);">Overall</div></div>
            </div>
            ${topIssues.length ? `<div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase;">Top issues</div>${topIssues.map((i: any, n: number) => `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px;color:rgba(255,255,255,0.5);"><span style="color:${i.sev==='high'?'#e05555':i.sev==='medium'?'#f0b429':'#6abf69'};font-weight:700;">${n+1}. </span>${i.title}</div>`).join('')}` : ''}
            <div style="text-align:center;margin-top:20px;">
              <a href="mailto:${clientEmail}" style="display:inline-block;background:#5b3fa0;color:#fff;font-size:13px;font-weight:600;padding:10px 22px;border-radius:100px;text-decoration:none;margin-right:8px;">Reply to lead →</a>
              <a href="${url}" target="_blank" style="display:inline-block;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;padding:10px 22px;border-radius:100px;text-decoration:none;">Visit site →</a>
            </div>
          </div>
        </div>
      `);
      await sendEmail(ERIC, `New Audit Lead: ${clientName} (${url}) — ${score}/100`, ericHtml);
      if (clientEmail && userConfirmHtml) await sendEmail(clientEmail, `Your free site score for ${clientName}`, userConfirmHtml);
      return json({ ok: true });
    }

    // ── WELCOME — new client portal created (sent from admin createClient) ──
    if (type === 'welcome') {
      const name = body.clientName || (body.client && body.client.name) || 'there';
      const email = body.clientEmail || (body.client && (body.client.contact_email || body.client.email)) || '';
      const pass = (body.meta && body.meta.password) || (body.creds && body.creds.password) || '';
      if (!email) return json({ error: 'no client email' }, 400);
      const html = notifyShell(
        `Welcome to your project portal, ${name}`,
        [
          `Your client portal is ready. This is where you'll see project progress, share files, approve work, message me, and view invoices, all in one place.`,
          `<strong>Your login</strong><br>Email: ${email}<br>Password: ${pass || '(set in your welcome details)'}`,
          `Sign in any time at the link below. I'd recommend changing your password after your first login.`,
        ],
        { label: 'Open your portal →', href: 'https://davisdigitalstudio.com/portal' }
      );
      await sendEmail(email, `Your Davis Digital Studio portal is ready`, html);
      // Also notify Eric so there's a record
      await sendEmail(ERIC, `Portal created: ${name}`, notifyShell(`New client portal created`, [`${name} (${email}) now has a portal.`]));
      return json({ ok: true });
    }

    // ── CONTACT REPLY — auto-reply to a contact form submission ──
    if (type === 'contact_reply') {
      const to = body.to || body.clientEmail;
      const name = body.name || body.clientName || 'there';
      const service = body.service || 'your project';
      if (!to) return json({ error: 'no recipient' }, 400);
      const html = notifyShell(
        `Thanks for reaching out, ${name}`,
        [
          `I got your message about ${service} and I'll get back to you personally within one business day.`,
          `In the meantime, feel free to reply to this email with anything else you'd like me to know.`,
          `— Eric Davis, Davis Digital Studio`,
        ],
        { label: 'See my work →', href: 'https://davisdigitalstudio.com/work' }
      );
      await sendEmail(to, `Thanks for reaching out to Davis Digital Studio`, html);
      return json({ ok: true });
    }

    // ── GENERIC NOTIFY — covers portal/admin notification emails to Eric ──
    // Types like client_message, brief_submitted, contract_acked, approval_needed,
    // eric_message, eric_file, invoice_reminder, etc. all land here.
    if (type && (body.clientName !== undefined || body.message !== undefined || body.subject !== undefined)) {
      const name = body.clientName || (body.client && body.client.name) || 'A client';
      const subject = body.subject || '';
      const message = body.message || '';
      const pretty = String(type).replace(/_/g, ' ');
      // Decide recipient: messages/briefs/approvals from client notify Eric;
      // eric_* notify the client.
      const toClient = String(type).startsWith('eric_') || type === 'approval_needed' || type === 'invoice_reminder';
      const recipient = toClient
        ? (body.clientEmail || (body.client && (body.client.contact_email || body.client.email)) || '')
        : ERIC;
      if (!recipient) return json({ ok: true, skipped: 'no recipient' });
      const heading = toClient ? `Update on your project` : `${name}: ${pretty}`;
      const lines = [
        subject ? `<strong>${subject}</strong>` : '',
        message ? message.replace(/\n/g, '<br>') : '',
      ].filter(Boolean);
      const cta = toClient
        ? { label: 'Open your portal →', href: 'https://davisdigitalstudio.com/portal' }
        : { label: 'Open admin →', href: 'https://davisdigitalstudio.com/dds-studio-manage-9k2p' };
      await sendEmail(recipient, toClient ? `Update on your project` : `${pretty} — ${name}`, notifyShell(heading, lines.length ? lines : ['(no details)'], cta));
      return json({ ok: true });
    }

    return json({ error: 'Unknown type' }, 400);

  } catch (err) {
    console.error('Edge function error:', err);
    return json({ error: String(err) }, 500);
  }
});
