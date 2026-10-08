import {
  PhHouse,
  PhTray,
  PhChatsCircle,
  PhSlidersHorizontal,
  PhBooks,
  PhBroadcast,
  PhBuildings,
} from '@phosphor-icons/vue';

import { listLinks } from './presets.js';

// The one list of where an owner can go. The sidebar and the phone tab bar both
// read it, so a new page is added here once.
//
// `match` is the path prefix that lights the item up: /agent/hours still
// highlights "Settings". `count` and `attention` drive the small badge.
export function navGroups(getters) {
  if (getters['auth/isAdmin']) {
    return [{ label: null, items: [{ to: '/admin', match: '/admin', label: 'Businesses', icon: PhBuildings }] }];
  }

  const config = getters['agent/config'];
  return [
    {
      // Daily work: what the agent took and who is waiting.
      label: null,
      items: [
        { to: '/home', match: '/home', label: 'Home', icon: PhHouse },
        { to: '/inbox', match: '/inbox', label: 'Inbox', icon: PhTray, count: getters['inbox/waitingTotal'] },
        {
          to: '/conversations',
          match: '/conversations',
          label: 'Conversations',
          short: 'Chats',
          icon: PhChatsCircle,
          count: getters['inbox/needsHuman'],
          attention: true,
        },
      ],
    },
    {
      // Setting the agent up: what it knows and where customers find it.
      label: 'Your agent',
      items: [
        { to: '/agent', match: '/agent', label: 'Settings', short: 'Agent', icon: PhSlidersHorizontal },
        ...listLinks(config && config.preset).map((link) => ({ ...link, match: link.to })),
        { to: '/knowledge', match: '/knowledge', label: 'Knowledge', icon: PhBooks },
        { to: '/channels', match: '/channels', label: 'Channels', icon: PhBroadcast },
      ],
    },
  ];
}

export function isActive(item, path) {
  return path === item.match || path.startsWith(item.match + '/');
}
