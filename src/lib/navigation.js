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
} from '@phosphor-icons/vue';

import { t } from '../i18n/index.js';
import { listLinks } from './presets.js';

// The one list of where an owner can go. The sidebar and the phone tab bar both
// read it, so a new page is added here once.
//
// `match` is the path prefix that lights the item up: /agent/hours still
// highlights "Settings". `count` and `attention` drive the small badge.
// A moderator (`canManage` false, backend D97) sees the daily work and the lists only.
export function navGroups({ isAdmin, canManage = true, preset, waitingTotal, needsHuman }) {
  if (isAdmin) {
    return [{ label: null, items: [{ to: '/admin', match: '/admin', label: t('nav.businesses'), icon: PhBuildings }] }];
  }

  return [
    {
      // Daily work: what the agent took and who is waiting.
      label: null,
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
        // A shop's calls to confirm its orders (backend D89).
        ...(preset === 'shop' ? [{ to: '/calls', match: '/calls', label: t('nav.calls'), icon: PhPhoneCall }] : []),
      ],
    },
    {
      // Setting the agent up: what it knows and where customers find it.
      label: t('nav.yourAgent'),
      items: canManage
        ? [
            { to: '/agent', match: '/agent', label: t('nav.settings'), short: t('nav.agent'), icon: PhSlidersHorizontal },
            ...listLinks(preset).map((link) => ({ ...link, match: link.to })),
            { to: '/knowledge', match: '/knowledge', label: t('nav.knowledge'), icon: PhBooks },
            { to: '/channels', match: '/channels', label: t('nav.channels'), icon: PhBroadcast },
          ]
        : listLinks(preset).map((link) => ({ ...link, match: link.to })),
    },
    // The business itself: who works in it.
    ...(canManage
      ? [
          {
            label: t('nav.business'),
            items: [
              { to: '/team', match: '/team', label: t('nav.team'), icon: PhUsersThree },
              { to: '/billing', match: '/billing', label: t('nav.billing'), icon: PhCreditCard },
            ],
          },
        ]
      : []),
  ];
}

export function isActive(item, path) {
  return path === item.match || path.startsWith(item.match + '/');
}
