import { request } from './client.js';

// The presets a business can start from. Public: no token needed.
export function fetchPresets() {
  return request('/presets');
}

// 404 not_found until the business has created its agent.
export function fetchAgent(token) {
  return request('/agent', { token });
}

export function createAgent(token, body) {
  return request('/agent', { method: 'POST', body, token });
}

// Top-level fields replace the config's, so send the whole `knowledge`.
export function updateAgent(token, patch) {
  return request('/agent', { method: 'PATCH', body: patch, token });
}

export function fetchItems(token) {
  return request('/agent/items', { token });
}

// The agent's items become exactly this list, in this order.
export function replaceItems(token, items) {
  return request('/agent/items', { method: 'PUT', body: items, token });
}

// dryRun checks the file and shows what would be saved; false replaces the items.
export function importItems(token, csv, dryRun) {
  return request('/agent/items/import', {
    method: 'POST',
    body: { csv, dry_run: dryRun },
    token,
  });
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
