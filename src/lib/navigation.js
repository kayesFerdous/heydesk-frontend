import {
  PhHouse,
  PhTray,
  PhChatsCircle,
  PhSlidersHorizontal,
  PhBooks,
  PhBroadcast,
  PhBuildings,
  PhPhoneCall,
  PhUsersThree,
  PhCreditCard,
  PhTicket,
} from '@phosphor-icons/vue';

import { t } from '../i18n/index.js';
import { listLinks } from './presets.js';

// The one list of where an owner can go. The sidebar and the phone tab bar both
// read it, so a new page is added here once.
//
// `match` is the path prefix that lights the item up: /agent/talk still
// highlights "Settings". `count` and `attention` drive the small badge.
// A moderator (`canManage` false, backend D97) sees the daily work and the lists only.
export function navGroups({ isAdmin, canManage = true, waitingTotal, needsHuman }) {
  if (isAdmin) {
    return [{ label: null, items: [{ to: '/admin', match: '/admin', label: t('nav.businesses'), icon: PhBuildings }] }];
  }

  // Set up once and opened rarely, listed under their own heading.
  const setup = [
    { to: '/agent', match: '/agent', label: t('nav.agent'), icon: PhSlidersHorizontal },
    { to: '/knowledge', match: '/knowledge', label: t('nav.knowledge'), icon: PhBooks },
    { to: '/channels', match: '/channels', label: t('nav.channels'), icon: PhBroadcast },
    { to: '/team', match: '/team', label: t('nav.team'), icon: PhUsersThree },
    { to: '/billing', match: '/billing', label: t('nav.billing'), icon: PhCreditCard },
  ];

  return [
    {
      // Daily work: what the agent took and who is waiting. The phone tab bar
      // shows this group.
      label: t('nav.yourDesk'),
      items: [
        { to: '/home', match: '/home', label: t('nav.home'), icon: PhHouse },
        { to: '/inbox', match: '/inbox', label: t('nav.inbox'), icon: PhTray, count: waitingTotal },
        {
          to: '/conversations',
          match: '/conversations',
          label: t('nav.conversations'),
          short: t('nav.chats'),
          icon: PhChatsCircle,
          count: needsHuman,
          attention: true,
        },
        // The shop's calls to confirm its orders (backend D89).
        { to: '/calls', match: '/calls', label: t('nav.calls'), icon: PhPhoneCall },
      ],
    },
    {
      // What the shop sells: the products the agent answers from, and its
      // coupon codes (backend D133).
      label: t('nav.business'),
      items: [
        ...listLinks().map((link) => ({ ...link, match: link.to })),
        ...(canManage ? [{ to: '/coupons', match: '/coupons', label: t('nav.coupons'), icon: PhTicket }] : []),
      ],
    },
    // A moderator (D97) has no setup.
    {
      label: t('nav.setup'),
      items: canManage ? setup : [],
    },
  ].filter((group) => group.items.length);
}

export function isActive(item, path) {
  return path === item.match || path.startsWith(item.match + '/');
}
