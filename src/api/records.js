import { request } from './client.js';
import { agentKind } from './agent.js';
import { formatMoney } from '../lib/format.js';
import { localeTag } from '../i18n/index.js';

// The backend keeps each kind of record in its own table (D41): a restaurant's
// orders, a shop's orders, a clinic's appointments, and the messages every agent
// takes. This file turns them into one "record" shape, so the inbox pages stay the
// same. A shop's orders are "order" records too: only their path and steps differ.
const JOBS = {
  order: { kind: 'order', path: '/orders' },
  appointment: { kind: 'request', path: '/appointments' },
  message: { kind: 'request', path: '/messages' },
};

// What each kind of agent takes, in the inbox's order.
const JOBS_FOR = {
  restaurant: ['order', 'message'],
  clinic: ['appointment', 'message'],
  receptionist: ['message'],
  shop: ['order', 'message'],
};

// Where a job's records are, when it isn't JOBS[job].path for this kind of business.
const PATHS = { shop: { order: '/shop/orders' } };

const pathOfId = {}; // record id → its path, so a status change knows which table to use
const jobOfId = {};

function when(iso) {
  return new Date(iso).toLocaleString(localeTag(), {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

function toRecord(job, row, path) {
  jobOfId[row.id] = job;
  pathOfId[row.id] = path;
  const record = {
    ...row,
    job,
    kind: JOBS[job].kind,
    customer_name: row.name,
    customer_phone: row.phone,
    code: row.code || `#${row.number}`,
    details: {},
    note: row.note || '',
  };
  if (job === 'order' && row.zone !== undefined) {
    // A shop's order: delivered by a courier, with its own steps (lib/flows.js).
    record.flow = 'shop_order';
    record.address = `${row.address} (${row.zone})`;
  } else if (job === 'order') {
    record.due_at = row.pickup_at;
  }
  // A detail's name is `records.details.<key>` in the language files.
  if (job === 'appointment') {
    record.details = { doctor: row.doctor_name, time: when(row.at) };
    if (row.paid) record.details.depositPaid = formatMoney(row.paid);
  }
  if (job === 'message') {
    record.details = { message: row.body };
    if (row.best_time) record.details.bestTime = row.best_time;
  }
  return record;
}

async function jobsOf() {
  return JOBS_FOR[await agentKind()] || ['message'];
}

async function pathOf(job) {
  return (PATHS[await agentKind()] || {})[job] || JOBS[job].path;
}

// One page, newest first: up to `limit` records made before `before` (the last
// record's created_at). The server's page is at most 100.
async function fetchJob(job, { status, q, limit, before } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  if (limit) params.set('limit', limit);
  if (before) params.set('before', before);
  const query = params.toString();
  const path = await pathOf(job);
  const rows = await request(path + (query ? `?${query}` : ''));
  return rows.map((row) => toRecord(job, row, path));
}

// The sidebar numbers: each job the agent does, with how many are waiting.
// Only the waiting ones are asked for (status=new), not the whole history.
export async function fetchInbox() {
  const jobs = await jobsOf();
  return Promise.all(
    jobs.map(async (job) => ({
      job,
      kind: JOBS[job].kind,
      waiting: (await fetchJob(job, { status: 'new' })).length,
    })),
  );
}

// Newest first. `job` is "order", "appointment" or "message"; left out, all of
// them (then `limit` is per job, so only page with one job).
export async function fetchRecords({ job, status, q, limit, before } = {}) {
  const jobs = job ? [job] : await jobsOf();
  const lists = await Promise.all(jobs.map((j) => fetchJob(j, { status, q, limit, before })));
  return lists.flat().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// One record, for a link that names a record older than the first page.
export async function fetchRecord(job, recordId) {
  const path = await pathOf(job);
  return toRecord(job, await request(`${path}/${recordId}`), path);
}

export async function setRecordStatus(recordId, status) {
  const job = jobOfId[recordId] || 'message';
  const path = pathOfId[recordId] || JOBS[job].path;
  const row = await request(`${path}/${recordId}`, { method: 'PATCH', body: { status } });
  return toRecord(job, row, path);
}

// The records each conversation made, by conversation id. The backend's
// conversation no longer lists them, so a page fetches the records once and
// looks them up here, instead of fetching every record again per conversation.
export function byConversation(records) {
  const map = {};
  records.forEach((r) => (map[r.conversation_id] = map[r.conversation_id] || []).push(r));
  return map;
}
