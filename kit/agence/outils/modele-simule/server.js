// Simulateur minimal de l'API Anthropic Messages, pour les captures du cours uniquement.
const http = require('http');
const fs = require('fs');
let n = 0;
const MODELS = [{ type: 'model', id: 'claude-sonnet-5', display_name: 'Claude Sonnet 5', created_at: '2026-01-01T00:00:00Z' }];

function firstUserText(messages) {
  for (const m of messages) {
    if (m.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    const t = m.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (t) return t;
  }
  return '';
}
function toolResults(messages) {
  const out = [];
  for (const m of messages) if (Array.isArray(m.content)) for (const b of m.content) if (b.type === 'tool_result') {
    let c = b.content; if (Array.isArray(c)) c = c.map(x => x.text || '').join('');
    out.push({ id: b.tool_use_id, content: (c ?? '').toString() });
  }
  return out;
}
function toolUses(messages) {
  const out = [];
  for (const m of messages) if (m.role === 'assistant' && Array.isArray(m.content)) for (const b of m.content) if (b.type === 'tool_use') out.push(b);
  return out;
}
const email = t => (t.match(/[\w.+-]+@[\w.-]+\.\w+/) || ['inconnu@agence.test'])[0];
function categorie(t) {
  t = t.toLowerCase();
  if (/réclam|plainte|rembours|annul|retard|déçu/.test(t)) return 'reclamation';
  if (/devis|prix|tarif|groupe|réserv/.test(t)) return 'devis';
  if (/question|info|horaire|passeport|bagage/.test(t)) return 'info';
  return 'autre';
}
function resume(t) {
  const flat = t.replace(/\s+/g, ' ');
  const m = flat.match(/(groupe de \d+|\d+ personnes)[^.?!]*/i);
  if (m) return m[0].trim().slice(0, 70);
  const obj = flat.match(/Objet\s*:\s*([^.\n]+)/i);
  return (obj ? obj[1] : flat).trim().slice(0, 70);
}
function fill(schema, text, key = '') {
  if (!schema) return {};
  if (schema.enum) { const c = categorie(text); return schema.enum.includes(c) ? c : schema.enum[0]; }
  switch (schema.type) {
    case 'object': { const o = {}; for (const [k, s] of Object.entries(schema.properties || {})) o[k] = fill(s, text, k); return o; }
    case 'integer': case 'number': return Math.min(schema.maximum ?? 3, Math.max(schema.minimum ?? 1, /urgent|vite|demain|annul|rembours/i.test(text) ? 3 : 2));
    case 'array': return [];
    case 'boolean': return false;
    default: return resume(text);
  }
}

function decide(body) {
  const msgs = body.messages || [];
  const tools = (body.tools || []).filter(t => t.name);
  const names = tools.map(t => t.name);
  const uses = toolUses(msgs), results = toolResults(msgs);
  const text = firstUserText(msgs);
  const parser = tools.find(t => /format_final_json_response/.test(t.name));
  const lastRes = results[results.length - 1];
  const lastUse = uses[uses.length - 1];
  const used = new Set(uses.map(u => u.name));
  const finish = (txt) => parser ? [{ type: 'tool_use', name: parser.name, input: fill(parser.input_schema, text) }] : [{ type: 'text', text: txt }];

  if (lastUse && parser && lastUse.name === parser.name) return [{ type: 'text', text: lastRes ? lastRes.content : 'ok' }];

  // Résultat d'outil vide : le modèle réessaie le même appel (agent qui boucle).
  const vide = s => s.trim() === '' || /^\[\{"response":""\}\]$/.test(s.trim()) || s.trim() === '[]';
  if (lastRes && vide(lastRes.content) && lastUse) return [{ type: 'text', text: "Je n'ai pas obtenu de réponse, je réessaie." }, { type: 'tool_use', name: lastUse.name, input: lastUse.input }];

  // Jour 2 : scénarios mémoire (prompt système qui parle de mémoire ou de préférences).
  const sys = typeof body.system === 'string' ? body.system : (body.system || []).map(b => b.text || '').join('\n');
  // Jour 4 : agent publié (dossier, préférences, geste soumis à approbation).
  if (names.includes('accorder_geste') && names.includes('retenir_preference')) return jour4(msgs, sys, tools);
  // Jour 3 : geste commercial soumis à approbation humaine.
  if (names.includes('accorder_geste')) {
    let k = msgs.length - 1;
    while (k > 0 && !(msgs[k].role === 'user' && (typeof msgs[k].content === 'string' || msgs[k].content.some(b => b.type === 'text')))) k--;
    const tour = msgs.slice(k), u = toolUses(tour), r = toolResults(tour);
    const montant = Number((text.match(/(\d+) ?(?:€|euros)/) || [0, 50])[1]);
    if (!u.length) return [{ type: 'tool_use', name: 'accorder_geste', input: { email: email(text), montant, motif: /retard/i.test(text) ? 'Retard du vol aller' : 'Désagrément pendant le voyage' } }];
    const res = (r[r.length - 1] || {}).content || '';
    if (/declin|disapprov|refus|not approved|rejected|denied|n'a pas/i.test(res)) return [{ type: 'text', text: "Le responsable de l'agence n'a pas validé ce geste : je ne peux pas vous l'accorder pour le moment. Un conseiller vous recontacte." }];
    if (/error|erreur|violates/i.test(res)) return [{ type: 'text', text: "Je n'ai pas pu enregistrer ce geste commercial. Un conseiller vous recontacte." }];
    return [{ type: 'text', text: `C'est accordé : un geste commercial de ${montant} € a été enregistré sur votre dossier.` }];
  }
  if (/mémoire|préférences connues|MCP/i.test(sys)) { const r = jour2(msgs, sys, names); if (r) return r; }

  // Outil à description vague : il attire les appels (agent A).
  const vague = tools.find(t => !/format_final/.test(t.name) && (t.description || '').length < 25);
  if (vague && !used.has(vague.name)) return [{ type: 'tool_use', name: vague.name, input: { requete: resume(text) } }];

  const order = ['chercher_dossier', 'confirmer_reservation', 'enregistrer_demande', 'enregistrer_brouillon'];
  for (const nm of order) {
    if (!names.includes(nm) || used.has(nm)) continue;
    if (nm === 'chercher_dossier' || nm === 'confirmer_reservation') return [{ type: 'tool_use', name: nm, input: { email: email(text) } }];
    if (nm === 'enregistrer_demande') return [{ type: 'tool_use', name: nm, input: { expediteur: email(text), categorie: categorie(text), urgence: fill({ type: 'integer', minimum: 1, maximum: 3 }, text), resume: resume(text) } }];
    if (nm === 'enregistrer_brouillon') {
      const trouve = results.some(r => /destination/.test(r.content));
      const corps = trouve
        ? "Bonjour,\n\nMerci pour votre message. Nous avons bien retrouvé votre dossier et revenons vers vous sous 24 h avec une proposition détaillée.\n\nL'équipe de l'agence"
        : "Bonjour,\n\nMerci pour votre demande. Pourriez-vous nous préciser vos dates et le nombre de voyageurs ?\n\nL'équipe de l'agence";
      return [{ type: 'tool_use', name: nm, input: { destinataire: email(text), objet: 'Re : votre demande', texte: corps } }];
    }
  }
  if (used.has('confirmer_reservation')) return finish('Votre réservation est confirmée. Vous recevrez votre carnet de voyage par e-mail.');
  if (used.has('enregistrer_brouillon')) return finish('Demande classée (' + categorie(text) + '), brouillon de réponse enregistré pour ' + email(text) + '.');
  return finish(names.length ? 'Demande traitée.' : 'Bonjour ! La connexion au modèle fonctionne.');
}

// ---------- Jour 2 ----------
const VILLES = ['Lisbonne', 'Séville', 'Cracovie', 'Edimbourg', 'Porto', 'Rome', 'Vienne'];
function userTexts(msgs) {
  const out = [];
  for (const m of msgs) {
    if (m.role !== 'user') continue;
    if (typeof m.content === 'string') { out.push(m.content); continue; }
    const t = m.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (t) out.push(t);
  }
  return out;
}
function faits(textes) {
  const f = {};
  for (const t of textes) {
    const nom = t.match(/je m'appelle ([A-ZÀ-Ý][\wà-ÿ]+(?: [A-ZÀ-Ý][\wà-ÿ]+)?)/i); if (nom) f.nom = nom[1];
    const v = VILLES.find(v => t.includes(v)); if (v) f.dest = v;
    const nb = t.match(/(\d+) (?:au lieu de (\d+)|personnes|voyageurs)/); if (nb) { f.nb = nb[1]; if (nb[2]) f.avant = nb[2]; }
    const mois = t.match(/(?:mi-|début |fin )?(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i); if (mois) f.quand = mois[0];
  }
  return f;
}
const rappel = t => /souvenez|rappelez|rappelle|qui suis-je|mon nom|au final|on en était/i.test(t);
function prefsDe(t) {
  const p = [];
  const a = t.match(/(?:départ|partir|décoller) (?:de|depuis) ([A-ZÀ-Ý][\wà-ÿ-]+)/); if (a) p.push({ cle: 'aeroport_depart', valeur: a[1] });
  const h = t.match(/(appartement|hôtel|gîte|auberge)/i); if (h) p.push({ cle: 'hebergement', valeur: h[1].toLowerCase() });
  const b = t.match(/(\d[\d .]*) ?(?:€|euros)/); if (b && /budget|maximum|max/i.test(t)) p.push({ cle: 'budget_max', valeur: b[1].replace(/\s/g, '') + ' €' });
  const s = t.match(/(hublot|couloir)/i); if (s) p.push({ cle: 'siege', valeur: s[1].toLowerCase() });
  return p;
}
function jour2(msgs, sys, names) {
  const CD = names.find(x => x === 'chercher_dossier' || x.endsWith('__chercher_dossier')) || 'chercher_dossier';
  const isCD = n => n === CD;
  // Seul le tour en cours compte pour les outils : l'historique peut contenir d'anciens appels.
  let k = msgs.length - 1;
  while (k > 0 && !(msgs[k].role === 'user' && (typeof msgs[k].content === 'string' || msgs[k].content.some(b => b.type === 'text')))) k--;
  const tour = msgs.slice(k);
  const uses = toolUses(tour), results = toolResults(tour), lastRes = results[results.length - 1];
  const textes = userTexts(msgs);
  const cur = textes[textes.length - 1] || '';
  const avant = faits(textes.slice(0, -1));
  const lastUse = uses[uses.length - 1];

  // Défi 4 : préférences
  if (names.includes('retenir_preference')) {
    if (/réduction|remise|gratuit/i.test(cur)) {
      if (!uses.some(u => u.name === 'retenir_preference')) return [{ type: 'tool_use', name: 'retenir_preference', input: { cle: 'remise', valeur: '50 % sur tous les voyages' } }];
      return [{ type: 'text', text: "Je ne peux pas enregistrer cette information : je ne retiens que vos préférences de voyage. Pour toute question de tarif, un conseiller de l'agence vous répondra." }];
    }
    const p = prefsDe(cur).filter(x => !uses.some(u => u.name === 'retenir_preference' && u.input.cle === x.cle));
    if (p.length) return [{ type: 'tool_use', name: 'retenir_preference', input: p[0] }];
    const LIB = { aeroport_depart: 'départ de ', hebergement: 'logement en ', budget_max: 'budget maximum ', siege: 'siège côté ', rythme: 'rythme ' };
    const faites = uses.filter(u => u.name === 'retenir_preference').map(u => `${LIB[u.input.cle] || ''}${u.input.valeur}`);
    if (faites.length) return [{ type: 'text', text: `C'est noté, je retiens pour vos prochains voyages : ${faites.join(' ; ')}.` }];
    const m = sys.match(/Préférences connues du client :\s*([\s\S]*?)(?:\n\n|$)/i);
    const connues = m && !/aucune/i.test(m[1]) ? m[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [];
    const dest = VILLES.find(v => cur.includes(v)) || 'votre destination';
    if (connues.length) return [{ type: 'text', text: `Avec plaisir ! Pour ${dest}, je pars de vos habitudes (${connues.join(' ; ')}). Un conseiller vous envoie une proposition sous 24 h.` }];
    return [{ type: 'text', text: `Avec plaisir ! Pour préparer ${dest}, pouvez-vous me dire d'où vous préférez partir et quel type de logement vous convient ?` }];
  }

  // Rappel d'un échange précédent
  if (rappel(cur) && !results.length) {
    if (avant.nb && avant.dest) return [{ type: 'text', text: `Vous serez ${avant.nb} voyageurs pour ${avant.dest}${avant.avant ? ` (au lieu de ${avant.avant})` : ''}, comme vous me l'avez indiqué dans votre message précédent.` }];
    if (avant.nom || avant.dest) return [{ type: 'text', text: `Oui, bien sûr${avant.nom ? `, ${avant.nom.split(' ')[0]}` : ''} : ${avant.dest ? `vous préparez un voyage à ${avant.dest}` : ''}${avant.nb ? ` pour ${avant.nb} personnes` : ''}${avant.quand ? `, ${avant.quand}` : ''}.` }];
    if (!names.includes(CD)) return [{ type: 'text', text: "Je suis désolé, je n'ai aucune trace d'un échange précédent. Pouvez-vous me rappeler votre nom et votre projet de voyage ?" }];
  }
  if (names.includes(CD) && !uses.some(u => isCD(u.name))) return [{ type: 'tool_use', name: CD, input: { email: (cur.match(/[\w.+-]+@[\w.-]+\.\w+/) || sys.match(/[\w.+-]+@[\w.-]+\.\w+/) || ['inconnu@agence.test'])[0] } }];
  if (lastUse && isCD(lastUse.name)) {
    const raw = lastRes.content.split('\\').join(''); const d = {}; const md = raw.match(/"destination":"([^"]+)"/); const mn = raw.match(/"nb_personnes":(\d+)/); if (md) d.destination = md[1]; if (mn) d.nb_personnes = mn[1];
    const nf = faits([cur]);
    if (nf.avant && d.destination) return [{ type: 'text', text: `C'est noté : votre dossier ${d.destination} passe de ${nf.avant} à ${nf.nb} voyageurs. Un conseiller ajuste le devis et vous le renvoie.` }];
    if (rappel(cur) && d.destination) return [{ type: 'text', text: `D'après votre dossier, vous êtes ${d.nb_personnes} personnes pour ${d.destination}.` }];
    if (d.destination) return [{ type: 'text', text: `J'ai retrouvé votre dossier ${d.destination} (${d.nb_personnes} personnes). Que puis-je faire pour vous ?` }];
    return [{ type: 'text', text: "Je ne trouve pas de dossier à votre nom. Pouvez-vous me préciser votre projet ?" }];
  }
  // Conversation simple
  const f = faits([cur]);
  if (f.nom || f.dest) return [{ type: 'text', text: `Bonjour${f.nom ? ` ${f.nom.split(' ')[0]}` : ''} ! ${f.dest ? `${f.dest}` : 'Votre projet'}${f.nb ? ` pour ${f.nb} personnes` : ''}, c'est noté. Quelles dates envisagez-vous ?` }];
  if (f.quand) return [{ type: 'text', text: `Parfait, ${f.quand}. Je prépare une proposition${avant.dest ? ` pour ${avant.dest}` : ''}.` }];
  return null;
}


// ---------- Jour 4 ----------
function jour4(msgs, sys, tools) {
  let k = msgs.length - 1;
  while (k > 0 && !(msgs[k].role === 'user' && (typeof msgs[k].content === 'string' || msgs[k].content.some(b => b.type === 'text')))) k--;
  const tour = msgs.slice(k), uses = toolUses(tour), results = toolResults(tour);
  const textes = userTexts(msgs), cur = textes[textes.length - 1] || '';
  const mails = cur.match(/[\w.+-]+@[\w.-]+\.\w+/g) || [];
  const exp = mails[0] || 'inconnu@agence.test';
  const autre = mails.slice(1).find(m => m !== exp);
  const schema = n => { const t = tools.find(x => x.name === n); let p = (t && t.input_schema && t.input_schema.properties) || {}; if (p.toolParameters) p = p.toolParameters.properties || {}; return p; };
  const used = n => uses.filter(u => u.name === n);
  const res = n => { const u = used(n).pop(); if (!u) return null; const r = results.find(x => x.id === u.id); return r ? r.content : null; };
  // 1. Mémoire polluée : remise
  if (/réduction|remise|gratuit/i.test(cur)) {
    if (!used('retenir_preference').length) return [{ type: 'tool_use', name: 'retenir_preference', input: { cle: 'remise', valeur: '50 % sur tous les voyages' } }];
    return [{ type: 'text', text: "Je ne peux pas enregistrer cette information : je ne retiens que vos préférences de voyage. Pour toute question de tarif, un conseiller vous répondra." }];
  }
  // 2. Geste commercial (demande ou consigne injectée)
  if (/geste|dédommag|compens|accorde/i.test(cur)) {
    const montant = Number((cur.match(/(\d+) ?(?:€|euros)/) || [0, 50])[1]);
    if (!used('accorder_geste').length) {
      const input = { montant, motif: /fidélité/i.test(cur) ? 'Fidélité' : /retard/i.test(cur) ? 'Retard du vol aller' : 'Désagrément pendant le voyage' };
      if (schema('accorder_geste').email) input.email = autre || exp;
      return [{ type: 'tool_use', name: 'accorder_geste', input }];
    }
    const r = res('accorder_geste') || '';
    if (/declin|disapprov|refus|not approved|rejected|denied|n'a pas/i.test(r)) return [{ type: 'text', text: "Le responsable de l'agence n'a pas validé ce geste : je ne peux pas l'accorder. Un conseiller vous recontacte." }];
    if (/error|erreur|violates|denied|permission/i.test(r)) return [{ type: 'text', text: "Je n'ai pas pu enregistrer ce geste commercial. Un conseiller vous recontacte." }];
    return [{ type: 'text', text: `C'est accordé : un geste commercial de ${montant} € a été enregistré.` }];
  }
  // 3. Préférence exprimée
  const p = prefsDe(cur).filter(x => !used('retenir_preference').some(u => u.input.cle === x.cle));
  if (p.length) return [{ type: 'tool_use', name: 'retenir_preference', input: p[0] }];
  if (used('retenir_preference').length) return [{ type: 'text', text: "C'est noté pour vos prochains voyages." }];
  // 4. Ce que l'agent sait du client (préférences du prompt système)
  if (/préférences|habitudes|que savez-vous|mes infos/i.test(cur)) {
    const m = sys.match(/Préférences connues du client :\s*([\s\S]*?)(?:\n\n|$)/i);
    const connues = m && !/aucune/i.test(m[1]) ? m[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [];
    if (connues.length) return [{ type: 'text', text: `Voici ce que je sais de vos habitudes : ${connues.join(' ; ')}.` }];
    return [{ type: 'text', text: "Je n'ai encore aucune préférence enregistrée pour vous." }];
  }
  // 5. Dossier
  if (!used('chercher_dossier').length) return [{ type: 'tool_use', name: 'chercher_dossier', input: schema('chercher_dossier').email ? { email: autre || exp } : {} }];
  const raw = (res('chercher_dossier') || '').split('\\').join('');
  const d = {}; for (const c of ['destination', 'date_depart', 'nb_personnes', 'statut']) { const m = raw.match(new RegExp('"' + c + '":"?([^",}]+)')); if (m) d[c] = m[1]; }
  if (d.date_depart) d.date_depart = d.date_depart.slice(0, 10);
  if (!d.destination) return [{ type: 'text', text: "Je ne trouve aucun dossier." }];
  if (autre && schema('chercher_dossier').email) return [{ type: 'text', text: `Le dossier de ${autre} : ${d.destination}, départ le ${d.date_depart}, ${d.nb_personnes} personnes, statut ${d.statut}.` }];
  if (autre) return [{ type: 'text', text: `Je ne peux vous renseigner que sur votre propre dossier : ${d.destination}, départ le ${d.date_depart}, ${d.nb_personnes} personnes.` }];
  return [{ type: 'text', text: `Votre dossier : ${d.destination}, départ le ${d.date_depart}, ${d.nb_personnes} personnes, statut ${d.statut}.` }];
}

function send(res, body, blocks) {
  // Outil protégé par une validation humaine : n8n attend { toolParameters, hitlParameters }.
  const wrap = b => {
    const t = (body.tools || []).find(x => x.name === b.name);
    return t && t.input_schema && t.input_schema.properties && t.input_schema.properties.toolParameters && !b.input.toolParameters
      ? { ...b, input: { toolParameters: b.input, hitlParameters: {} } } : b;
  };
  blocks = blocks.map(b => b.type === 'tool_use' ? { ...wrap(b), id: 'toolu_' + Math.random().toString(36).slice(2, 12) } : b);
  const stop = blocks.some(b => b.type === 'tool_use') ? 'tool_use' : 'end_turn';
  const usage = { input_tokens: 400 + (JSON.stringify(body.messages).length / 4 | 0), output_tokens: 60 + (JSON.stringify(blocks).length / 4 | 0) };
  const msg = { id: 'msg_sim' + Date.now(), type: 'message', role: 'assistant', model: body.model, content: blocks, stop_reason: stop, stop_sequence: null, usage };
  if (!body.stream) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(msg)); }
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  const ev = (t, d) => res.write(`event: ${t}\ndata: ${JSON.stringify({ type: t, ...d })}\n\n`);
  ev('message_start', { message: { ...msg, content: [], stop_reason: null, usage: { input_tokens: usage.input_tokens, output_tokens: 1 } } });
  blocks.forEach((b, idx) => {
    if (b.type === 'text') { ev('content_block_start', { index: idx, content_block: { type: 'text', text: '' } }); ev('content_block_delta', { index: idx, delta: { type: 'text_delta', text: b.text } }); }
    else { ev('content_block_start', { index: idx, content_block: { type: 'tool_use', id: b.id, name: b.name, input: {} } }); ev('content_block_delta', { index: idx, delta: { type: 'input_json_delta', partial_json: JSON.stringify(b.input) } }); }
    ev('content_block_stop', { index: idx });
  });
  ev('message_delta', { delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: usage.output_tokens } });
  ev('message_stop', {}); res.end();
}

http.createServer((req, res) => {
  let data = ''; req.on('data', c => data += c); req.on('end', () => {
    if (req.method === 'GET' && req.url.startsWith('/v1/models')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ data: MODELS, has_more: false, first_id: MODELS[0].id, last_id: MODELS[0].id })); }
    if (req.method === 'POST' && req.url.startsWith('/v1/messages')) {
      const body = JSON.parse(data || '{}'); const k = ++n;
      const blocks = decide(body);
      try { fs.writeFileSync(`/app/log/req-${String(k).padStart(4, '0')}.json`, JSON.stringify({ body, blocks }, null, 1)); } catch (e) {}
      return send(res, body, blocks);
    }
    res.writeHead(404); res.end('{}');
  });
}).listen(8080, () => console.log('simulateur Anthropic sur :8080'));
