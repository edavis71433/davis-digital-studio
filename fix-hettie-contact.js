/* ============================================================
   ONE-OFF FIX: create the missing contacts row for Hettie Orange
   Designs, using her existing client record as the source of truth.

   HOW TO RUN:
   1. Log into the admin panel (dds-studio-manage-9k2p.html) as usual.
   2. Open the browser DevTools console (F12 / Cmd+Opt+J).
   3. Paste this entire block in and press Enter.
   4. Read the console output — it tells you exactly what happened
      at each step, and is safe to re-run (won't create a duplicate).

   This does NOT touch the clients table. It only reads from it once
   to get the exact name + contact_email already on file, then
   writes a single new row to contacts if (and only if) one doesn't
   already exist for that email.
   ============================================================ */
(async function fixHettieContact() {
  const jwt = await adminJwt();
  if (!jwt) { console.error('Not signed in — log into the admin panel first, then re-run this.'); return; }

  async function call(body) {
    const res = await fetch(SB_URL + "/functions/v1/clever-api", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + SB_KEY, "x-dds-user-jwt": jwt },
      body: JSON.stringify(body),
    });
    let json = {};
    try { json = await res.json(); } catch (e) {}
    return { ok: res.ok, json };
  }

  console.log('Step 1 — looking up the existing Hettie Orange Designs client record…');
  const clientLookup = await call({
    type: 'admin_query',
    path: 'clients?select=id,name,contact_email,email&name=ilike.*Hettie*&limit=5',
  });
  if (!clientLookup.ok || !clientLookup.json.data || !clientLookup.json.data.length) {
    console.error('Could not find a client matching "Hettie". Nothing was changed. Raw response:', clientLookup.json);
    return;
  }
  if (clientLookup.json.data.length > 1) {
    console.warn('More than one client matched "Hettie" — stopping so nothing ambiguous gets written. Matches:', clientLookup.json.data);
    return;
  }
  const client = clientLookup.json.data[0];
  const clientEmail = (client.contact_email || client.email || '').trim();
  console.log('Found client:', client);
  if (!clientEmail) {
    console.error('This client record has no contact_email or email on file — nothing to match a contact to. Nothing was changed.');
    return;
  }

  console.log('Step 2 — checking whether a contact already exists for', clientEmail, '…');
  const existing = await call({
    type: 'admin_query',
    path: 'contacts?select=id,name,email,stage,source&email=eq.' + encodeURIComponent(clientEmail.toLowerCase()) + '&limit=1',
  });
  if (existing.ok && existing.json.data && existing.json.data.length) {
    console.log('A contact already exists for this email — not creating a duplicate. Existing row:', existing.json.data[0]);
    console.log('If this contact still isn\'t showing in the Start Partnership dropdown, the issue is not a missing row — stop here and let\'s look at that separately.');
    return;
  }
  console.log('No existing contact found for this email. Proceeding to create one.');

  console.log('Step 3 — inserting the contact, matching the exact pattern the app itself uses…');
  const insertResult = await call({
    type: 'admin_write', table: 'contacts', op: 'insert',
    payload: {
      name: client.name,
      email: clientEmail.toLowerCase(),
      stage: 'active',
      source: 'created',
      auth_user_id: null, // no portal login exists yet for this contact
    },
  });
  if (!insertResult.ok || !insertResult.json.data || !insertResult.json.data[0]) {
    console.error('Insert failed. Nothing else was touched. Raw response:', insertResult.json);
    return;
  }
  const newContact = insertResult.json.data[0];
  console.log('Contact created:', newContact);

  console.log('Step 4 — verifying everything lines up…');
  const verifyClient = await call({ type: 'admin_query', path: 'clients?select=id,name,contact_email,email&id=eq.' + client.id + '&limit=1' });
  const verifyContact = await call({ type: 'admin_query', path: 'contacts?select=id,name,email,stage,source&id=eq.' + newContact.id + '&limit=1' });

  const c = verifyClient.json.data && verifyClient.json.data[0];
  const k = verifyContact.json.data && verifyContact.json.data[0];
  const clientStillExists = !!c;
  const contactExists = !!k;
  const emailsMatch = c && k && (c.contact_email || c.email || '').toLowerCase() === (k.email || '').toLowerCase();

  console.log('──────────────────────────────────────────');
  console.log('1. Hettie client still exists:', clientStillExists ? '✅' : '❌', c);
  console.log('2. Hettie contact exists:     ', contactExists ? '✅' : '❌', k);
  console.log('3. Client email = contact email:', emailsMatch ? '✅' : '❌');
  console.log('4/5. Open "Start a partnership", pick Hettie Orange Designs as the');
  console.log('     Client — the Contact dropdown should now list', client.name,
              '(' + clientEmail.toLowerCase() + '), and it should auto-select');
  console.log('     since the emails match exactly. That part needs your eyes —');
  console.log('     I can\'t open the UI from here to confirm it directly.');
  console.log('──────────────────────────────────────────');
})();
