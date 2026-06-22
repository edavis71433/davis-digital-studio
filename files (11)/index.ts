import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

// ── DEEP AUDIT ─────────────────────────────────────────────────────────────
// Fetches the homepage HTML, robots.txt, and sitemap.xml server-side.
// Parses for signals PSI does not measure: LocalBusiness schema, NAP on page,
// Google Maps embed, hours, social profile links, H1 structure, sitemap presence,
// word count, image alt coverage, OG tags.
async function deepAudit(targetUrl: string) {
  const out: any = {
    url: targetUrl,
    domain: '',
    https: false,
    fetchedHtml: false,
    onPage: {
      title: '', titleLength: 0,
      metaDescription: '', metaDescriptionLength: 0,
      canonical: null, h1Count: 0, h1Text: '',
      h2Count: 0, h3Count: 0,
      ogTitle: false, ogDescription: false, ogImage: false, ogUrl: false,
      twitterCard: false,
      wordCount: 0,
      imageCount: 0, imagesWithAlt: 0,
      internalLinks: 0, externalLinks: 0,
      favicon: false,
      langAttr: false,
    },
    schema: {
      blocks: 0,
      types: [] as string[],
      hasLocalBusiness: false,
      hasOrganization: false,
      hasWebSite: false,
      hasBreadcrumb: false,
      localBusinessNAP: null as any,
    },
    local: {
      phoneOnPage: false, phone: null as string | null,
      zipOnPage: false,
      googleMapsEmbed: false,
      hoursMentioned: false,
      socialLinks: [] as string[],
    },
    discoverability: {
      robotsTxt: false,
      robotsTxtBlocksAll: false,
      sitemapDeclared: false,
      sitemapUrl: null as string | null,
      sitemapXml: false,
      sitemapUrlCount: 0,
    },
  };

  let u: URL;
  try { u = new URL(targetUrl); } catch { return out; }
  out.domain = u.hostname;
  out.https = u.protocol === 'https:';

  // 1. Fetch homepage HTML
  let html = '';
  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DDS-Audit-Bot/1.0; +https://davisdigitalstudio.com)' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    if (res.ok) {
      html = await res.text();
      out.fetchedHtml = true;
    }
  } catch (_) { /* ignore — return partial */ }

  if (html) {
    const lc = html.toLowerCase();

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      out.onPage.title = titleMatch[1].replace(/\s+/g, ' ').trim();
      out.onPage.titleLength = out.onPage.title.length;
    }

    // Meta description (try both orderings)
    const md1 = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const md2 = html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const desc = md1 ? md1[1] : (md2 ? md2[1] : '');
    out.onPage.metaDescription = desc;
    out.onPage.metaDescriptionLength = desc.length;

    // Canonical
    const can = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    out.onPage.canonical = can ? can[1] : null;

    // Headings
    out.onPage.h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    out.onPage.h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    out.onPage.h3Count = (html.match(/<h3[\s>]/gi) || []).length;
    const h1Text = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    out.onPage.h1Text = h1Text ? h1Text[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200) : '';

    // OG and Twitter tags
    out.onPage.ogTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
    out.onPage.ogDescription = /<meta[^>]+property=["']og:description["']/i.test(html);
    out.onPage.ogImage = /<meta[^>]+property=["']og:image["']/i.test(html);
    out.onPage.ogUrl = /<meta[^>]+property=["']og:url["']/i.test(html);
    out.onPage.twitterCard = /<meta[^>]+name=["']twitter:card["']/i.test(html);

    // Favicon and lang
    out.onPage.favicon = /<link[^>]+rel=["'](?:shortcut |icon|apple-touch-icon)/i.test(html);
    out.onPage.langAttr = /<html[^>]+lang=/i.test(html);

    // Body text + word count
    const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
    const bodyText = (bodyMatch ? bodyMatch[0] : html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    out.onPage.wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

    // Images and alt coverage
    const imgs = html.match(/<img[^>]*>/gi) || [];
    out.onPage.imageCount = imgs.length;
    out.onPage.imagesWithAlt = imgs.filter(t => /\salt=["'][^"']/.test(t)).length;

    // Internal vs external links
    const anchors = html.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
    const host = u.hostname.replace(/^www\./, '');
    let internal = 0, external = 0;
    for (const a of anchors) {
      const href = (a.match(/href=["']([^"']+)["']/i) || [])[1] || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      if (href.startsWith('/') || href.startsWith('?') || href.toLowerCase().includes(host)) internal++;
      else if (/^https?:\/\//i.test(href)) external++;
    }
    out.onPage.internalLinks = internal;
    out.onPage.externalLinks = external;

    // Schema JSON-LD
    const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const schemas: any[] = [];
    for (const m of blocks) {
      try {
        const parsed = JSON.parse(m[1].trim());
        if (Array.isArray(parsed)) schemas.push(...parsed);
        else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) schemas.push(...parsed['@graph']);
        else schemas.push(parsed);
      } catch (_) { /* skip malformed */ }
    }
    out.schema.blocks = blocks.length;
    const typeStrs: string[] = [];
    for (const s of schemas) {
      if (!s || !s['@type']) continue;
      if (Array.isArray(s['@type'])) typeStrs.push(...s['@type']);
      else typeStrs.push(s['@type']);
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
        name: !!lbSchema.name,
        address: !!lbSchema.address,
        phone: !!lbSchema.telephone,
        hours: !!(lbSchema.openingHours || lbSchema.openingHoursSpecification),
        geo: !!lbSchema.geo,
        sameAs: !!(lbSchema.sameAs && (Array.isArray(lbSchema.sameAs) ? lbSchema.sameAs.length : 1)),
        image: !!lbSchema.image,
        priceRange: !!lbSchema.priceRange,
      };
    }

    // Local signals from page text
    const phone = bodyText.match(/(\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/);
    out.local.phoneOnPage = !!phone;
    out.local.phone = phone ? phone[0] : null;
    out.local.zipOnPage = /\b\d{5}(-\d{4})?\b/.test(bodyText);
    out.local.googleMapsEmbed = /maps\.google\.com\/maps|google\.com\/maps\/embed|maps\.googleapis|google\.com\/maps\?/i.test(html);
    out.local.hoursMentioned = /\b(mon|tue|wed|thu|fri|sat|sun)(day)?\b[\s\S]{0,40}\d{1,2}\s*(am|pm|:)/i.test(bodyText);

    const socials = ['facebook.com','instagram.com','twitter.com','x.com','linkedin.com','youtube.com','tiktok.com','yelp.com','pinterest.com'];
    for (const p of socials) if (lc.includes(p)) out.local.socialLinks.push(p);
  }

  // robots.txt
  try {
    const rRes = await fetch(`${u.protocol}//${u.hostname}/robots.txt`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DDS-Audit-Bot/1.0)' },
    });
    if (rRes.ok) {
      const rText = await rRes.text();
      out.discoverability.robotsTxt = true;
      out.discoverability.robotsTxtBlocksAll = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(rText);
      const sd = rText.match(/^Sitemap:\s*(\S+)/im);
      out.discoverability.sitemapDeclared = !!sd;
      out.discoverability.sitemapUrl = sd ? sd[1] : null;
    }
  } catch (_) { /* not found */ }

  // sitemap.xml
  try {
    const smUrl = out.discoverability.sitemapUrl || `${u.protocol}//${u.hostname}/sitemap.xml`;
    const sRes = await fetch(smUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DDS-Audit-Bot/1.0)' },
    });
    if (sRes.ok) {
      const sText = await sRes.text();
      out.discoverability.sitemapXml = true;
      out.discoverability.sitemapUrlCount = (sText.match(/<url>/gi) || []).length || (sText.match(/<loc>/gi) || []).length;
    }
  } catch (_) { /* not found */ }

  return out;
}

function emailWrap(body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f0820;font-family:'Helvetica Neue',Arial,sans-serif;">${body}</body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.json();
    const { type } = body;

    // ── PSI PROXY ──
    if (type === 'psi_fetch') {
      const { url } = body;
      if (!url) return new Response(JSON.stringify({ error: 'No URL provided' }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 400 });

      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo&category=accessibility&key=${PSI_KEY}`;

      try {
        const psiRes = await fetch(psiUrl, { signal: AbortSignal.timeout(60000) });
        const psiData = await psiRes.json();
        if (psiData.error) {
          return new Response(JSON.stringify({ error: psiData.error.message || 'PSI error', code: psiData.error.code }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 200 });
        }
        return new Response(JSON.stringify({ data: psiData }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 200 });
      } catch (psiErr) {
        const isTimeout = psiErr instanceof Error && (psiErr.name === 'TimeoutError' || psiErr.message.includes('timeout'));
        return new Response(JSON.stringify({ error: isTimeout ? 'timeout' : 'fetch_failed', message: String(psiErr) }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // ── DEEP AUDIT ──
    if (type === 'deep_audit') {
      const { url } = body;
      if (!url) return new Response(JSON.stringify({ error: 'No URL provided' }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 400 });
      try {
        const result = await deepAudit(url);
        return new Response(JSON.stringify({ data: result }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 200 });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'deep_audit_failed', message: String(e) }), { headers: { ...cors, 'Content-Type': 'application/json' }, status: 200 });
      }
    }

    // ── AUDIT LEAD — sends emails. audit.html builds notifyHtml and userConfirmHtml. ──
    if (type === 'audit_lead') {
      const { clientName, clientEmail, meta = {} } = body;
      const { url, bizType, city, score, perf, seo, a11y, lcp, fcp, cls, tbt, topIssues = [], userConfirmHtml, notifyHtml, fallback } = meta;

      const scoreColor = score < 45 ? '#e05555' : score < 65 ? '#f0b429' : '#6abf69';

      // Notify Eric — fall back to a basic email if audit.html didn't pre-build a notifyHtml
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
