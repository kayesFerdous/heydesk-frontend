import { request } from './client.js';
import { agentKind } from './agent.js';

// The backend keeps each kind of record in its own table (D41): a restaurant's
// orders, a clinic's appointments, and the messages every agent takes. This file
// turns them into one "record" shape, so the inbox pages stay the same.
const JOBS = {
  order: { title: 'Pickup orders', kind: 'order', path: '/orders', name: 'Order' },
  appointment: { title: 'Appointment requests', kind: 'request', path: '/appointments', name: 'Appointment' },
  message: { title: 'Messages', kind: 'request', path: '/messages', name: 'Message' },
};

// What each kind of agent takes, in the inbox's order.
const JOBS_FOR = {
  restaurant: ['order', 'message'],
  clinic: ['appointment', 'message'],
  receptionist: ['message'],
};

const jobOfId = {}; // record id → job, so a status change knows which table to use

function when(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

function toRecord(job, row) {
  jobOfId[row.id] = job;
  const record = {
    ...row,
    job,
    kind: JOBS[job].kind,
    title: JOBS[job].name,
    customer_name: row.name,
    customer_phone: row.phone,
    code: row.code || `#${row.number}`,
    details: {},
    note: row.note || '',
  };
  if (job === 'order') record.due_at = row.pickup_at;
  if (job === 'appointment') record.details = { doctor: row.doctor_name, time: when(row.at) };
  if (job === 'message') {
    record.details = { message: row.body };
    if (row.best_time) record.details['best time'] = row.best_time;
  }
  return record;
}

async function jobsOf(token) {
  return JOBS_FOR[await agentKind(token)] || ['message'];
}

async function fetchJob(token, job, { status, q } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  const query = params.toString();
  const rows = await request(JOBS[job].path + (query ? `?${query}` : ''), { token });
  return rows.map((row) => toRecord(job, row));
}

// The sidebar numbers: each job the agent does, with how many are waiting.
export async function fetchInbox(token) {
  const jobs = await jobsOf(token);
  return Promise.all(
    jobs.map(async (job) => {
      const records = await fetchJob(token, job);
      return {
        job,
        title: JOBS[job].title,
        kind: JOBS[job].kind,
        waiting: records.filter((r) => r.status === 'new').length,
        total: records.length,
      };
    }),
  );
}

// Newest first. `job` is "order", "appointment" or "message"; left out, all of them.
export async function fetchRecords(token, { job, status, q } = {}) {
  const jobs = job ? [job] : await jobsOf(token);
  const lists = await Promise.all(jobs.map((j) => fetchJob(token, j, { status, q })));
  return lists.flat().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function setRecordStatus(token, recordId, status) {
  const job = jobOfId[recordId] || 'message';
  const row = await request(`${JOBS[job].path}/${recordId}`, { method: 'PATCH', body: { status }, token });
  return toRecord(job, row);
}

// The records one conversation made (the backend's conversation no longer lists them).
export async function fetchRecordsOf(token, conversationId) {
  const all = await fetchRecords(token);
  return all.filter((r) => r.conversation_id === conversationId);
}
