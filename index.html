import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY = "re_aL6S2BX2_GB4y1T88EirAgfZNMz7yFfST";
const FROM = "Davis Digital Studio <eric@davisdigitalstudio.com>";
const ERIC = "eric@davisdigitalstudio.com";
const SB_URL = "https://qksstlqzbhesadrrofgn.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrc3N0bHF6Ymhlc2FkcnJvZmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzMwMDMsImV4cCI6MjA5NzU0OTAwM30.4V94Ua7z5cntPWtvtqN24TUnfY5A6K6-zCxY0iEcgYo";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to, subject, html) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  return r.json();
}

function portalBtn(label) {
  return `<a href="https://davisdigitalstudio.com/portal" style="display:inline-block;background:#5b3fa0;color:#fff;padding:11px 22px;border-radius:100px;text-decoration:none;font-weight:600;font-size:13px;margin-top:14px;">${label}</a>`;
}

function emailWrap(body) {
  return `<div style="font-family:'DM Sans',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1523;">
    <div style="font-family:Georgia,serif;font-size:18px;margin-bottom:24px;border-bottom:1px solid #ede8f7;padding-bottom:16px;">
      Davis<span style="color:#5b3fa0;">Digital</span> Studio
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #ede8f7;font-size:11px;color:#7a6d8e;">
      Davis Digital Studio &nbsp;·&nbsp; davisdigitalstudio.com &nbsp;·&nbsp; eric@davisdigitalstudio.com
    </div>
  </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const sb = createClient(SB_URL, SB_KEY);

  try {
    const body = await req.json();
    const { type, clientName, clientEmail, message, subject, meta } = body;
    let result;

    // ── AUDIT LEAD (from free site score tool on audit.html) ──
    if (type === "audit_lead") {
      const { url, bizType, city, score, perf, seo, a11y, lcp, fcp, cls, tbt, fallback, topIssues, userConfirmHtml } = meta || {};
      const scoreColor = score < 45 ? "#e05555" : score < 65 ? "#f0b429" : "#6abf69";

      const topIssuesHtml = (topIssues || []).map((i, n) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${i.sev==="high"?"#e05555":i.sev==="medium"?"#f0b429":"#6abf69"};font-size:10px;font-weight:700;color:#fff;text-align:center;line-height:20px;margin-right:8px;">${n+1}</span>
          <strong style="color:#fff;">${i.title}</strong><br>
          <span style="font-size:12px;color:rgba(255,255,255,0.45);padding-left:28px;display:block;margin-top:2px;">${i.sev.toUpperCase()} PRIORITY</span>
        </td></tr>`
      ).join("");

      const notifyHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f0820;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
        <div style="margin-bottom:20px;"><a href="https://davisdigitalstudio.com" style="font-family:Georgia,serif;font-size:18px;color:#fff;text-decoration:none;">Davis<span style="color:#c4aee8;">Digital</span> Studio</a></div>
        <div style="background:#1e1338;border-radius:16px;padding:28px;margin-bottom:20px;">
          <div style="font-size:11px;color:#c4aee8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">New Mini Audit Lead</div>
          <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#fff;margin:0 0 20px;line-height:1.2;">${clientName}</h1>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.4);width:110px;">Business</td><td style="font-size:13px;color:#fff;">${clientName}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.4);">Type</td><td style="font-size:13px;color:#fff;">${bizType || "—"}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.4);">City</td><td style="font-size:13px;color:#fff;">${city || "—"}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.4);">Email</td><td style="font-size:13px;color:#c4aee8;"><a href="mailto:${clientEmail}" style="color:#c4aee8;">${clientEmail}</a></td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.4);">Website</td><td style="font-size:13px;color:#c4aee8;"><a href="${url}" style="color:#c4aee8;" target="_blank">${url}</a></td></tr>
          </table>
          <div style="display:flex;gap:12px;margin-bottom:20px;">
            <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:16px;text-align:center;">
              <div style="font-size:36px;font-weight:700;color:${scoreColor};">${score}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">Overall /100</div>
            </div>
            ${perf != null ? `<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;font-weight:600;color:${perf<50?"#e05555":perf<90?"#f0b429":"#6abf69"};">${perf}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">Performance</div></div>` : ""}
            ${seo != null ? `<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;font-weight:600;color:${seo<50?"#e05555":seo<90?"#f0b429":"#6abf69"};">${seo}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">SEO</div></div>` : ""}
            ${a11y != null ? `<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;font-weight:600;color:${a11y<50?"#e05555":a11y<90?"#f0b429":"#6abf69"};">${a11y}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">Accessibility</div></div>` : ""}
          </div>
          ${lcp ? `<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:rgba(255,255,255,0.45);">Core Web Vitals — <strong style="color:rgba(255,255,255,0.7);">LCP:</strong> ${lcp} &nbsp;·&nbsp; <strong style="color:rgba(255,255,255,0.7);">FCP:</strong> ${fcp||"—"} &nbsp;·&nbsp; <strong style="color:rgba(255,255,255,0.7);">CLS:</strong> ${cls||"—"} &nbsp;·&nbsp; <strong style="color:rgba(255,255,255,0.7);">TBT:</strong> ${tbt||"—"}</div>` : ""}
          <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:12px;letter-spacing:1px;text-transform:uppercase;">Top Issues Shown to Lead</div>
          <table style="width:100%;border-collapse:collapse;">${topIssuesHtml}</table>
        </div>
        <div style="text-align:center;">
          <a href="mailto:${clientEmail}" style="display:inline-block;background:#5b3fa0;color:#fff;font-size:13px;font-weight:600;padding:12px 24px;border-radius:100px;text-decoration:none;margin-right:10px;">Reply to lead →</a>
          <a href="${url}" target="_blank" style="display:inline-block;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;padding:12px 24px;border-radius:100px;text-decoration:none;">Visit their site →</a>
        </div>
        <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.2);margin-top:20px;">Sent automatically by davisdigitalstudio.com mini audit · ${fallback ? "heuristic mode" : "PageSpeed API"}</p>
      </div></body></html>`;

      // Send notification to Eric
      await sendEmail(ERIC, `🔍 New audit lead: ${clientName} — ${score}/100 · ${bizType} · ${city}`, notifyHtml);

      // Send confirmation to lead (userConfirmHtml built in audit.html)
      if (userConfirmHtml) {
        result = await sendEmail(clientEmail, `A few things I noticed about ${clientName || "your site"}`, userConfirmHtml);
      }
    }

    // ── CLIENT → ERIC ──
    else if (type === "client_message") {
      result = await sendEmail(ERIC, `💬 New message from ${clientName}`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">New message from ${clientName}</h2>
          <blockquote style="border-left:3px solid #5b3fa0;padding:12px 16px;background:#f7f4fd;border-radius:0 8px 8px 0;margin:16px 0;font-size:14px;line-height:1.7;">${message}</blockquote>
          ${portalBtn("View in portal →")}`));
    }
    else if (type === "file_uploaded") {
      result = await sendEmail(ERIC, `📁 ${clientName} uploaded a file: ${message}`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">New file from ${clientName}</h2>
          <p style="font-size:14px;color:#7a6d8e;">File: <strong style="color:#1a1523;">${message}</strong></p>
          ${portalBtn("View in portal →")}`));
    }
    else if (type === "approval_action") {
      result = await sendEmail(ERIC, `✅ ${clientName} ${meta?.action || "responded to"}: ${message}`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">${clientName} ${meta?.action === "approved" ? "approved" : "requested revision on"}: ${message}</h2>
          ${meta?.note ? `<p style="font-size:14px;color:#7a6d8e;">Note: ${meta.note}</p>` : ""}
          ${portalBtn("View in portal →")}`));
    }
    else if (type === "contract_acked") {
      if (meta?.clientId) {
        await sb.from("clients").update({ contract_acked_at: new Date().toISOString() }).eq("id", meta.clientId);
      }
      result = await sendEmail(ERIC, `📃 ${clientName} signed the project agreement`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">${clientName} acknowledged the project agreement</h2>
          <p style="font-size:14px;color:#7a6d8e;">Signed on ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
          ${portalBtn("View client portal →")}`));
    }
    else if (type === "brief_submitted") {
      if (meta?.clientId && meta?.brief) {
        await sb.from("messages").insert({
          client_id: meta.clientId, from_who: "client",
          sender_name: clientName,
          text: "[PROJECT BRIEF]\n" + JSON.stringify(meta.brief)
        });
      }
      result = await sendEmail(ERIC, `📝 Project brief submitted by ${clientName}`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">Project brief from ${clientName}</h2>
          <div style="background:#f7f4fd;border-radius:10px;padding:16px;font-size:13px;line-height:2;">
            ${meta?.brief ? Object.entries(meta.brief).map(([k,v]) => v ? `<div><strong>${k}:</strong> ${v}</div>` : "").join("") : message}
          </div>
          ${portalBtn("View in portal →")}`));
    }

    // ── ERIC → CLIENT ──
    else if (type === "eric_message") {
      result = await sendEmail(clientEmail, `💬 New message from Eric — Davis Digital Studio`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">Hi ${clientName},</h2>
          <p style="font-size:14px;color:#7a6d8e;margin-bottom:4px;">Eric just sent you a message:</p>
          <blockquote style="border-left:3px solid #5b3fa0;padding:12px 16px;background:#f7f4fd;border-radius:0 8px 8px 0;margin:16px 0;font-size:14px;line-height:1.7;">${message}</blockquote>
          ${portalBtn("Reply in portal →")}`));
    }
    else if (type === "eric_file") {
      result = await sendEmail(clientEmail, `📁 Eric shared a file — Davis Digital Studio`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">Hi ${clientName},</h2>
          <p style="font-size:14px;color:#7a6d8e;">Eric just uploaded a file to your project portal:</p>
          <p style="font-size:15px;font-weight:600;margin:12px 0;">${message}</p>
          ${portalBtn("View & download in portal →")}`));
    }
    else if (type === "approval_needed") {
      result = await sendEmail(clientEmail, `✅ Action needed — ${subject} ready for review`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">Hi ${clientName},</h2>
          <p style="font-size:14px;color:#7a6d8e;">A deliverable is ready for your review:</p>
          <p style="font-size:15px;font-weight:600;margin:12px 0;">${subject}</p>
          <p style="font-size:14px;color:#7a6d8e;">${message||""}</p>
          ${portalBtn("Review & approve in portal →")}`));
    }
    else if (type === "invoice") {
      result = await sendEmail(clientEmail, `💳 Invoice ready — Davis Digital Studio`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">Hi ${clientName},</h2>
          <p style="font-size:14px;color:#7a6d8e;">A new invoice is ready:</p>
          <p style="font-size:15px;font-weight:600;margin:12px 0;">${subject} — ${message}</p>
          ${portalBtn("View & pay in portal →")}`));
    }
    else if (type === "welcome") {
      result = await sendEmail(clientEmail, `🎉 Your Davis Digital Studio portal is ready`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">Hi ${clientName},</h2>
          <p style="font-size:14px;line-height:1.8;color:#7a6d8e;">Your project portal is live. This is where you can track every phase, share files, leave feedback, and message me directly.</p>
          <div style="background:#f7f4fd;border-radius:12px;padding:20px;margin:20px 0;">
            <div style="font-size:13px;margin-bottom:6px;color:#7a6d8e;">Your login details:</div>
            <div style="font-size:14px;line-height:2;">
              <strong>Portal:</strong> davisdigitalstudio.com/portal<br>
              <strong>Username:</strong> ${meta?.username || ""}<br>
              <strong>Password:</strong> ${meta?.password || ""}
            </div>
          </div>
          <p style="font-size:14px;color:#7a6d8e;">First step — fill out the <strong>Project Brief</strong> inside the portal so I have everything I need to get started.</p>
          ${portalBtn("Open your portal →")}
          <p style="font-size:13px;color:#7a6d8e;margin-top:20px;">Questions? Reply to this email or message me directly in the portal. Talk soon,<br><strong>Eric Davis</strong></p>`));
    }
    else if (type === "invoice_reminder") {
      result = await sendEmail(ERIC, `⚠️ Invoice overdue reminder — ${clientName}`,
        emailWrap(`<h2 style="font-size:20px;margin-bottom:8px;">Overdue invoice: ${clientName}</h2>
          <p style="font-size:14px;color:#7a6d8e;">The following invoice has been pending for 7+ days:</p>
          <p style="font-size:15px;font-weight:600;margin:12px 0;">${subject} — ${message}</p>
          ${portalBtn("View in admin →")}`));
    }

    return new Response(JSON.stringify(result || { ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 200
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" }
    });
  }
});
