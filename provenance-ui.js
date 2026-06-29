/* ════════════════════════════════════════════════════════════════════════════
   PROVENANCE UI  —  the consistent way every number tells you how much to
   trust it. One component, used by HQ, the monthly review, the health panel,
   and analytics, so a "Measured" badge looks and means the same thing everywhere.

   Drop-in: paste the <style> block into the page's CSS (or a shared sheet) and
   the two functions into the page's JS. Tokens-only (no raw hex), so it inherits
   light/dark and the brand automatically. Matches tokens.css.

   Design intent (audited against Stripe/Linear restraint):
   - The badge is QUIET by default — a small dot + word, not a loud chip. Trust
     comes from consistency, not decoration.
   - It is TAPPABLE for the curious and IGNORABLE for everyone else. The owner
     who just wants the number sees the number; the skeptic taps and sees the
     receipts (inputs, assumptions, confidence, limits).
   - "Estimated" always shows its assumption inline-on-expand. Non-negotiable.
   ════════════════════════════════════════════════════════════════════════════ */

const PROV_STYLE = `
.prov{ display:inline-flex; align-items:center; gap:6px; cursor:help; position:relative;
  font-family:var(--sans,'Inter',system-ui,sans-serif); }
.prov-dot{ width:7px; height:7px; border-radius:50%; flex:0 0 auto; }
.prov-word{ font-size:11px; font-weight:600; letter-spacing:.02em; text-transform:uppercase;
  color:var(--muted,#8b8098); }
.prov-conf{ font-size:11px; font-weight:600; color:var(--muted,#8b8098); opacity:.8; }

/* tier colors — reuse status tokens so the meaning matches the rest of the app.
   measured=green (solid), calculated=brand purple (sound math),
   estimated=amber (assumption in play), inferred=muted (a read, not a fact). */
.prov--measured   .prov-dot{ background:var(--green,#1f9d57); }
.prov--measured   .prov-word{ color:var(--green,#1f9d57); }
.prov--calculated .prov-dot{ background:var(--p,#5b3fa0); }
.prov--calculated .prov-word{ color:var(--p,#5b3fa0); }
.prov--estimated  .prov-dot{ background:var(--amber,#d68a12); }
.prov--estimated  .prov-word{ color:var(--amber,#d68a12); }
.prov--inferred   .prov-dot{ background:var(--muted,#8b8098); }
.prov--inferred   .prov-word{ color:var(--muted,#8b8098); }

/* the explainer popover — opens on hover (desktop) or tap (mobile). */
.prov-pop{ position:absolute; bottom:calc(100% + 8px); left:0; z-index:40; width:min(280px,80vw);
  background:var(--surface,#fff); border:1px solid var(--line-strong,#ddd6ea);
  border-radius:var(--r,12px); box-shadow:var(--sh-3,0 14px 44px rgba(23,18,33,.16));
  padding:14px 14px 12px; opacity:0; visibility:hidden; transform:translateY(4px);
  transition:opacity .14s ease, transform .14s ease, visibility .14s; text-align:left; }
.prov:hover .prov-pop, .prov.is-open .prov-pop{ opacity:1; visibility:visible; transform:translateY(0); }
.prov-pop-h{ display:flex; align-items:center; gap:7px; margin-bottom:6px; }
.prov-pop-title{ font-size:12.5px; font-weight:700; color:var(--ink,#171221); }
.prov-pop-explain{ font-size:12.5px; line-height:1.5; color:var(--ink-2,#574d68); margin:0 0 8px; }
.prov-pop-section{ margin-top:8px; }
.prov-pop-label{ font-size:10px; font-weight:700; letter-spacing:.04em; text-transform:uppercase;
  color:var(--muted,#8b8098); margin-bottom:3px; }
.prov-pop-item{ font-size:12px; line-height:1.45; color:var(--ink-2,#574d68); padding-left:12px; position:relative; }
.prov-pop-item::before{ content:'·'; position:absolute; left:3px; color:var(--muted,#8b8098); }
.prov-pop-conf{ display:flex; align-items:center; gap:8px; margin-top:10px; padding-top:9px;
  border-top:1px solid var(--line,#ece8f1); }
.prov-pop-conf-bar{ flex:1; height:5px; border-radius:3px; background:var(--surface-3,#f3f0f9); overflow:hidden; }
.prov-pop-conf-fill{ height:100%; border-radius:3px; }
.prov-pop-conf-num{ font-size:11px; font-weight:700; color:var(--ink,#171221); }
.prov-asof{ font-size:11px; color:var(--muted,#8b8098); margin-top:7px; }
@media (prefers-reduced-motion: reduce){ .prov-pop{ transition:none; } }
`;

// inject once
(function ensureProvStyle(){
  if (typeof document === 'undefined') return;
  if (document.getElementById('prov-style')) return;
  const s = document.createElement('style');
  s.id = 'prov-style'; s.textContent = PROV_STYLE;
  document.head.appendChild(s);
})();

const PROV_TIER = {
  measured:   { word:'Measured',   explain:'Pulled straight from your live tools (like Google), exactly as reported.' },
  calculated: { word:'Calculated', explain:'Worked out from your real data with straightforward math.' },
  estimated:  { word:'Estimated',  explain:'A reasonable estimate. The assumption it uses is shown below.' },
  inferred:   { word:'Inferred',   explain:'Our best read from indirect signs, not a direct measurement.' },
};

function provEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// Render a provenance badge from a Provenanced object (the server shape).
// `opts.showConfidence` adds the % next to the word (default true for estimated/
// inferred, where the owner most benefits from seeing it).
function provBadge(p, opts){
  opts = opts || {};
  if (!p || !p.tier) return '';
  const tier = PROV_TIER[p.tier] ? p.tier : 'inferred';
  const meta = PROV_TIER[tier];
  const showConf = opts.showConfidence != null ? opts.showConfidence
    : (tier === 'estimated' || tier === 'inferred');
  const conf = (p.confidence != null) ? p.confidence : null;

  const confColor = conf == null ? 'var(--muted)'
    : conf >= 80 ? 'var(--green)' : conf >= 60 ? 'var(--p)' : conf >= 40 ? 'var(--amber)' : 'var(--red)';

  let pop = '<div class="prov-pop" role="tooltip">'
    + '<div class="prov-pop-h"><span class="prov-dot"></span><span class="prov-pop-title">'+provEsc(meta.word)+'</span></div>'
    + '<p class="prov-pop-explain">'+provEsc(meta.explain)+'</p>';

  if (p.inputs && p.inputs.length){
    pop += '<div class="prov-pop-section"><div class="prov-pop-label">'
      + (tier==='measured'?'Source':'Based on')+'</div>'
      + p.inputs.map(i => '<div class="prov-pop-item">'+provEsc(provFriendlyInput(i))+'</div>').join('') + '</div>';
  }
  if (p.assumptions && p.assumptions.length){
    pop += '<div class="prov-pop-section"><div class="prov-pop-label">Assumes</div>'
      + p.assumptions.map(a => '<div class="prov-pop-item">'+provEsc(a)+'</div>').join('') + '</div>';
  }
  if (p.limitations && p.limitations.length){
    pop += '<div class="prov-pop-section"><div class="prov-pop-label">Keep in mind</div>'
      + p.limitations.map(l => '<div class="prov-pop-item">'+provEsc(l)+'</div>').join('') + '</div>';
  }
  if (conf != null){
    pop += '<div class="prov-pop-conf"><span class="prov-pop-conf-num">'+conf+'%</span>'
      + '<div class="prov-pop-conf-bar"><div class="prov-pop-conf-fill" style="width:'+Math.max(4,conf)+'%;background:'+confColor+'"></div></div>'
      + '<span class="prov-conf" style="font-size:10px">confidence</span></div>';
  }
  if (p.as_of){ pop += '<div class="prov-asof">As of '+provEsc(provFmtDate(p.as_of))+'</div>'; }
  pop += '</div>';

  return '<span class="prov prov--'+tier+'" tabindex="0" onclick="this.classList.toggle(\'is-open\')">'
    + '<span class="prov-dot"></span><span class="prov-word">'+provEsc(meta.word)+'</span>'
    + (showConf && conf!=null ? '<span class="prov-conf">'+conf+'%</span>' : '')
    + pop + '</span>';
}

// Turn raw input keys into owner-friendly source names for the popover.
function provFriendlyInput(key){
  const map = {
    gbp:'Google Business Profile', ga4:'Google Analytics', gsc:'Google Search Console',
    psi:'Google PageSpeed', crm:'Your account history', derived:'Your account history',
    gbp_calls:'Calls from Google', conversions:'Actions on your site', search_clicks:'Google search clicks',
    sessions:'Website visitors', days_since_contact:'Time since we last spoke',
    open_approvals:'Items awaiting your approval', overdue_amount:'Overdue invoices',
    psi_performance:'Site speed score', psi_seo:'Search-readiness score', https_valid:'Secure connection',
    close_rate:'Typical share of calls that become jobs', job_value:'Your average job value',
    work_completed_30d:'Work delivered in the last 30 days', client_response_rate:'How quickly messages get answered',
  };
  return map[key] || key.replace(/_/g,' ');
}
function provFmtDate(iso){
  try { return new Date(iso).toLocaleDateString(undefined,{month:'short',year:'numeric'}); }
  catch { return iso; }
}

// Convenience: a number + its badge, the most common pairing.
// provValue(prov, '19 calls')  ->  "19 calls  •Measured"
function provValue(p, displayText, opts){
  return '<span style="display:inline-flex;align-items:center;gap:9px;flex-wrap:wrap">'
    + '<span>'+provEsc(displayText)+'</span>' + provBadge(p, opts) + '</span>';
}

if (typeof window !== 'undefined') {
  window.provBadge = provBadge;
  window.provValue = provValue;
}
