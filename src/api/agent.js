import { request } from './client.js';

// The backend has no presets any more (D41): each kind of business is a "desk"
// with its own fields and tables. This file keeps the shapes the pages use:
// a desk looks like a preset, its own fields are the `knowledge` form, and a
// restaurant's menu or a clinic's doctors are the "items".

// Fields every agent has; anything else in a desk's schema is its own.
const SHARED = ['name', 'business_name', 'timezone', 'country', 'currency', 'greeting', 'notes', 'faq', 'handoff'];
const ITEMS_LABEL = { restaurant: 'Menu', clinic: 'Doctors', receptionist: 'Services' };
const JOBS = {
  restaurant: [
    { id: 'order', label: 'pickup order', description: 'Customers order from your menu and pick it up. The agent adds up the total and reads it back before saving.' },
    { id: 'message', label: 'message for the team', description: 'Customers leave a message or ask for a call back.' },
  ],
  clinic: [
    { id: 'appointment', label: 'appointment request', description: "Patients ask to see a doctor on a day the doctor works. Your team calls to confirm." },
    { id: 'message', label: 'message for the team', description: 'Patients leave a message or ask for a call back.' },
  ],
  receptionist: [
    { id: 'message', label: 'message for the team', description: 'Visitors leave a message or ask for a call back.' },
  ],
};

// The business's desk: "restaurant", "clinic" or "receptionist". A business
// never changes its desk, so it is asked once per sign-in (per token) and the
// answer is reused by every list call, instead of a GET /agent before each one.
// The promise itself is kept, so calls made at the same moment share one request.
let kindOf = { token: null, kind: null };

export function agentKind(token) {
  if (kindOf.token !== token) {
    const kind = request('/agent', { token }).then((agent) => agent.kind);
    kindOf = { token, kind };
    // No agent yet (404) or the API is down: forget it, so the next call asks again.
    kind.catch(() => {
      if (kindOf.kind === kind) kindOf = { token: null, kind: null };
    });
  }
  return kindOf.kind;
}

function rememberKind(token, kind) {
  kindOf = { token, kind: Promise.resolve(kind) };
}

function ownSchema(schema) {
  const properties = {};
  for (const [key, value] of Object.entries(schema.properties || {})) {
    if (!SHARED.includes(key)) properties[key] = value;
  }
  return { ...schema, properties };
}

// The kinds of business an agent can be. Public: no token needed.
export async function fetchPresets() {
  const desks = await request('/desks');
  return desks.map((d) => ({
    id: d.kind,
    label: d.label,
    description: d.description,
    items_label: ITEMS_LABEL[d.kind] || 'Items',
    jobs: JOBS[d.kind] || [],
    knowledge_schema: ownSchema(d.config_schema),
  }));
}

function toInfo(agent) {
  const config = { preset: agent.kind, knowledge: {} };
  for (const [key, value] of Object.entries(agent.config)) {
    if (SHARED.includes(key)) config[key] = value;
    else config.knowledge[key] = value;
  }
  return { ...agent, config, jobs: JOBS[agent.kind] || [] };
}

// The pages send `knowledge` as one object; the backend wants its fields at the top.
function flatten(patch) {
  const flat = { ...(patch || {}), ...((patch && patch.knowledge) || {}) };
  ['knowledge', 'preset', 'instructions', 'jobs'].forEach((key) => delete flat[key]);
  return flat;
}

// 404 not_found until the business has created its agent.
export async function fetchAgent(token) {
  const agent = await request('/agent', { token });
  rememberKind(token, agent.kind);
  return toInfo(agent);
}

export async function createAgent(token, body) {
  const created = await request('/agent', {
    method: 'POST',
    body: { kind: body.preset, config: flatten(body.config) },
    token,
  });
  rememberKind(token, created.kind);
  return toInfo(created);
}

export async function updateAgent(token, patch) {
  return toInfo(await request('/agent', { method: 'PATCH', body: flatten(patch), token }));
}

// A clinic's doctor as an item, and back.
function doctorToItem(d) {
  return {
    code: d.code,
    name: d.name,
    description: d.description,
    price: d.fee,
    category: d.speciality,
    tags: [],
    available: d.available,
    attributes: { days: d.days, hours: `${d.start.slice(0, 5)}-${d.end.slice(0, 5)}`, languages: d.languages },
  };
}

function itemToDoctor(item) {
  const a = item.attributes || {};
  const [start, end] = String(a.hours || '09:00-17:00').split('-').map((t) => t.trim());
  return {
    code: item.code,
    name: item.name,
    description: item.description || '',
    fee: item.price,
    speciality: item.category,
    days: [].concat(a.days || []),
    start,
    end,
    languages: [].concat(a.languages || []),
    available: item.available !== false,
  };
}

export async function fetchItems(token) {
  const kind = await agentKind(token);
  if (kind === 'restaurant') return request('/menu', { token });
  if (kind === 'clinic') return (await request('/doctors', { token })).map(doctorToItem);
  return []; // a receptionist lists its services in its details
}

// The agent's items become exactly this list, in this order.
export async function replaceItems(token, items) {
  const kind = await agentKind(token);
  if (kind === 'restaurant') return request('/menu', { method: 'PUT', body: items, token });
  if (kind === 'clinic') {
    const saved = await request('/doctors', { method: 'PUT', body: items.map(itemToDoctor), token });
    return saved.map(doctorToItem);
  }
  throw Object.assign(new Error('A receptionist lists its services on the Agent page.'), { status: 400 });
}

// A CSV replaces the menu or the doctors. dryRun checks it and shows what would be saved.
export async function importItems(token, csv, dryRun) {
  const kind = await agentKind(token);
  const path = { restaurant: '/menu/import', clinic: '/doctors/import' }[kind];
  if (!path) throw Object.assign(new Error('A receptionist has no list to import.'), { status: 400 });
  const result = await request(path, { method: 'POST', body: { csv, dry_run: dryRun }, token });
  const preview = kind === 'clinic' ? result.preview.map(doctorToItem) : result.preview;
  return { ...result, preview, attributes: [] };
}

// The documents the agent reads when a question is not answered elsewhere.
// Newest first. A document is searchable as soon as the call returns.
export function fetchDocuments(token) {
  return request('/agent/documents', { token });
}

// Pasted text. Markdown is fine.
export function addTextDocument(token, title, text) {
  return request('/agent/documents', {
    method: 'POST',
    body: { title, text },
    token,
  });
}

// A .txt, .md or .pdf file, up to 10 MB. `title` may be empty: the server
// then uses the file name.
export function addFileDocument(token, file, title) {
  const form = new FormData();
  form.append('file', file);
  form.append('title', title || '');
  return request('/agent/documents/file', { method: 'POST', body: form, token });
}

// The only call that returns the full text.
export function fetchDocument(token, documentId) {
  return request(`/agent/documents/${documentId}`, { token });
}

export function deleteDocument(token, documentId) {
  return request(`/agent/documents/${documentId}`, { method: 'DELETE', token });
}
