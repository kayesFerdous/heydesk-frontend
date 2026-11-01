import { t } from '../i18n/index.js';

// The words for a role: "Owner", "Moderator" (backend D97) or "HeyDesk admin".
export function roleName(role) {
  if (role === 'admin') return t('shell.heyDeskAdmin');
  return role === 'moderator' ? t('shell.moderator') : t('shell.owner');
}

// The team's activity comes as the route that was called (backend D97):
// `{action: "PATCH /api/shop/orders/{order_id}", target: "order_id=…"}`. This
// turns it into words ("Changed an order") and, for a record or a conversation,
// a link to open it.

// The first part of the path after /api that names what was changed.
const THINGS = {
  orders: 'order',
  shop: 'order', // /api/shop/orders
  messages: 'message',
  conversations: 'conversation',
  calls: 'call',
  products: 'list',
  agent: 'settings',
  team: 'team',
};
const VERBS = { POST: 'added', PUT: 'changed', PATCH: 'changed', DELETE: 'removed' };
// The records the Inbox opens by id.
const INBOX_JOBS = ['order', 'message'];

export function describeActivity(event) {
  const [method, path = ''] = event.action.split(' ');
  const part = path.split('/')[2] || '';
  const thing = THINGS[part] || 'other';
  const id = event.target.split(',')[0].split('=')[1] || '';
  let to = null;
  if (id && INBOX_JOBS.includes(thing)) to = `/inbox?job=${thing}&open=${id}`;
  if (id && thing === 'conversation') to = `/conversations?open=${id}`;
  // Sending an invite again is a POST too, but adds no one.
  if (path.endsWith('/invite')) return { text: t('team.activity.resent'), to };
  return {
    text: t(`team.activity.${VERBS[method] || 'changed'}`, { thing: t(`team.things.${thing}`) }),
    to,
  };
}
