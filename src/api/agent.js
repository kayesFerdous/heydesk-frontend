import { request, getAuthToken } from './client.js';
import { t } from '../i18n/index.js';

// The backend has no presets any more (D41): each kind of business is a "desk"
// with its own fields and tables. This file keeps the shapes the pages use:
// a desk looks like a preset, its own fields are the `knowledge` form, and a
// restaurant's menu or a clinic's doctors are the "items".

// Fields every agent has; anything else in a desk's schema is its own.
const SHARED = ['name', 'business_name', 'timezone', 'country', 'currency', 'greeting', 'notes', 'faq', 'handoff'];
// What each kind of agent does. The words are `jobs.<kind>.<job>` in the language files.
const JOBS = {
  restaurant: ['order', 'message'],
  clinic: ['appointment', 'message'],
  receptionist: ['message'],
  shop: ['order', 'message'],
};

// The business's desk: "restaurant", "clinic" or "receptionist". A business
// never changes its desk, so it is asked once per sign-in (per token) and the
// answer is reused by every list call, instead of a GET /agent before each one.
// The promise itself is kept, so calls made at the same moment share one request.
let kindOf = { token: null, kind: null };

export function agentKind() {
  const token = getAuthToken();
  if (kindOf.token !== token) {
    const kind = request('/agent').then((agent) => agent.kind);
    kindOf = { token, kind };
    // No agent yet (404) or the API is down: forget it, so the next call asks again.
    kind.catch(() => {
      if (kindOf.kind === kind) kindOf = { token: null, kind: null };
    });
  }
  return kindOf.kind;
}

function rememberKind(kind) {
  kindOf = { token: getAuthToken(), kind: Promise.resolve(kind) };
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
export async function fetchAgent() {
  const agent = await request('/agent');
  rememberKind(agent.kind);
  return toInfo(agent);
}

export async function createAgent(body) {
  const created = await request('/agent', {
    method: 'POST',
    body: { kind: body.preset, config: flatten(body.config) },
  });
  rememberKind(created.kind);
  return toInfo(created);
}

export async function updateAgent(patch) {
  return toInfo(await request('/agent', { method: 'PATCH', body: flatten(patch) }));
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

// A shop's product as an item, and back. A product has no on/off switch: stock 0 is
// sold out. Switching one off makes it 0; switching it on stops counting it.
function productToItem(p) {
  return { ...p, tags: [], available: p.stock !== 0, attributes: {} };
}

function itemToProduct(item) {
  let stock = item.stock === undefined ? null : item.stock;
  if (!item.available) stock = 0;
  else if (stock === 0) stock = null;
  return {
    code: item.code,
    name: item.name,
    description: item.description || '',
    price: item.price,
    was_price: item.was_price ?? null, // before a sale; null: not on sale
    category: item.category,
    sizes: item.sizes || [],
    colours: item.colours || [],
    stock,
    variants: item.variants || [], // stock per size and colour (D56)
    photos: item.photos || [], // their URLs; the first is the one the agent shows (D57)
  };
}

// A product photo goes up on its own and comes back as { url }; the product
// keeps it once it's saved with that URL in its `photos` (backend D57).
export async function uploadProductPhoto(file) {
  const form = new FormData();
  form.append('file', file);
  return request('/products/photos', { method: 'POST', body: form });
}

export async function fetchItems() {
  const kind = await agentKind();
  if (kind === 'restaurant') return request('/menu');
  if (kind === 'clinic') return (await request('/doctors')).map(doctorToItem);
  if (kind === 'shop') return (await request('/products')).map(productToItem);
  return []; // a receptionist lists its services in its details
}

// The agent's items become exactly this list, in this order.
export async function replaceItems(items) {
  const kind = await agentKind();
  if (kind === 'restaurant') return request('/menu', { method: 'PUT', body: items });
  if (kind === 'clinic') {
    const saved = await request('/doctors', { method: 'PUT', body: items.map(itemToDoctor) });
    return saved.map(doctorToItem);
  }
  if (kind === 'shop') {
    const saved = await request('/products', { method: 'PUT', body: items.map(itemToProduct) });
    return saved.map(productToItem);
  }
  throw Object.assign(new Error(t('errors.noListToSave')), { status: 400 });
}

const IMPORT_PATHS = { restaurant: '/menu/import', clinic: '/doctors/import', shop: '/products/import' };

async function importPath() {
  const path = IMPORT_PATHS[await agentKind()];
  if (!path) throw Object.assign(new Error(t('errors.noListToImport')), { status: 400 });
  return path;
}

// The file's columns, its first rows, our fields, and the AI's guess at which
// of their columns is which of our fields: { columns, headers, samples, mapping, by_ai }.
export async function suggestColumns(csv) {
  return request(`${await importPath()}/suggest`, { method: 'POST', body: { csv } });
}

// A CSV replaces the menu, the doctors or the products. `mapping` is
// { ourField: theirColumn }, as the owner checked it. dryRun checks the file
// and shows what would be saved.
export async function importItems(csv, mapping, dryRun) {
  const path = await importPath();
  const result = await request(path, { method: 'POST', body: { csv, mapping, dry_run: dryRun } });
  return withItems(result);
}

// An import's answer, { saved, count, preview }, with the preview as items.
async function withItems(result) {
  const toItem = { clinic: doctorToItem, shop: productToItem }[await agentKind()];
  const preview = toItem ? result.preview.map(toItem) : result.preview;
  return { ...result, preview };
}

// A Google Sheet kept as the list (backend D58): read every few minutes, and
// while it's linked the list is changed there. `{url, synced_at, problem}`, or
// null while none is linked.
export async function fetchSheet() {
  try {
    return await request('/agent/sheet');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// The sheet's columns and the AI's match, as suggestColumns gives for a file.
export function suggestSheetColumns(url) {
  return request('/agent/sheet/suggest', { method: 'POST', body: { url } });
}

// Links the sheet and takes the list from it, answering like importItems.
// dryRun reads it and shows what would be saved.
export async function linkSheet(url, mapping, dryRun) {
  const result = await request('/agent/sheet', { method: 'PUT', body: { url, mapping, dry_run: dryRun } });
  return withItems(result);
}

export function syncSheet() {
  return request('/agent/sheet/sync', { method: 'POST' });
}

export function unlinkSheet() {
  return request('/agent/sheet', { method: 'DELETE' });
}

// A shop's WooCommerce store (backend D75): its products are the list, and the
// orders placed here are written into it, synced every 2 minutes.
// `{url, products, synced_at, problem}`, or null while none is linked.
export async function fetchWoo() {
  try {
    return await request('/agent/woo');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// Checks the key can read and write, links the store and takes its products.
// A wrong key or address is a 422 with `fields.key` or `fields.url`.
export function linkWoo(url, key, secret) {
  return request('/agent/woo', { method: 'PUT', body: { url, key, secret } });
}

export function syncWoo() {
  return request('/agent/woo/sync', { method: 'POST' });
}

export function unlinkWoo() {
  return request('/agent/woo', { method: 'DELETE' });
}

// The documents the agent reads when a question is not answered elsewhere.
// Newest first. A document is searchable as soon as the call returns.
export function fetchDocuments() {
  return request('/agent/documents');
}

// Pasted text. Markdown is fine.
export function addTextDocument(title, text) {
  return request('/agent/documents', {
    method: 'POST',
    body: { title, text },
  });
}

// A .txt, .md or .pdf file, up to 10 MB. `title` may be empty: the server
// then uses the file name.
export function addFileDocument(file, title) {
  const form = new FormData();
  form.append('file', file);
  form.append('title', title || '');
  return request('/agent/documents/file', { method: 'POST', body: form });
}

// The only call that returns the full text.
export function fetchDocument(documentId) {
  return request(`/agent/documents/${documentId}`);
}

export function deleteDocument(documentId) {
  return request(`/agent/documents/${documentId}`, { method: 'DELETE' });
}
