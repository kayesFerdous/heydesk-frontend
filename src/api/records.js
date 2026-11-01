import { request } from './client.js';

// The backend keeps each kind of record in its own table (D41): a shop's orders
// and the messages every agent takes. This file turns them into one "record"
// shape, so the inbox pages stay the same.
const JOBS = {
  order: { kind: 'order', path: '/shop/orders' },
  message: { kind: 'request', path: '/messages' },
};

// What the agent takes, in the inbox's order.
const JOB_LIST = ['order', 'message'];

const pathOfId = {}; // record id → its path, so a status change knows which table to use
const jobOfId = {};

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
  if (job === 'order') {
    // Delivered by a courier, with its own steps (lib/flows.js).
    record.flow = 'shop_order';
    record.address = `${row.address} (${row.zone})`;
    // Booked with the courier by the agent (backend D113): its parcel and last words.
    if (row.parcel_id) record.details.parcel = row.parcel_id;
    if (row.courier_status) record.details.courierSays = row.courier_status;
  }
  // A detail's name is `records.details.<key>` in the language files.
  if (job === 'message') {
    record.details = { message: row.body };
    if (row.best_time) record.details.bestTime = row.best_time;
  }
  return record;
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
  const path = JOBS[job].path;
  const rows = await request(path + (query ? `?${query}` : ''));
  return rows.map((row) => toRecord(job, row, path));
}

// The sidebar numbers: each job the agent does, with how many are waiting.
// Only the waiting ones are asked for (status=new), not the whole history.
export async function fetchInbox() {
  return Promise.all(
    JOB_LIST.map(async (job) => ({
      job,
      kind: JOBS[job].kind,
      waiting: (await fetchJob(job, { status: 'new' })).length,
    })),
  );
}

// Newest first. `job` is "order" or "message"; left out, all of
// them (then `limit` is per job, so only page with one job).
export async function fetchRecords({ job, status, q, limit, before } = {}) {
  const jobs = job ? [job] : JOB_LIST;
  const lists = await Promise.all(jobs.map((j) => fetchJob(j, { status, q, limit, before })));
  return lists.flat().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// One record, for a link that names a record older than the first page.
export async function fetchRecord(job, recordId) {
  const path = JOBS[job].path;
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
