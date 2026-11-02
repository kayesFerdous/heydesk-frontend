import { t } from '../i18n/index.js';

// The first-run checklist on Home, and where each gap in the agent is fixed.
//
// The backend's `missing` list is plain sentences ("Add your opening hours.").
// whereToFix() sends each one to the screen that fills it in.
export function whereToFix(item) {
  const text = item.toLowerCase();
  // "Connect SSLCommerz or bKash to take payments first." (backend D109)
  if (text.includes('sslcommerz') || text.includes('bkash') || text.includes('delivery')) return '/agent/payments';
  if (text.includes('phone') || text.includes('email') || text.includes('person')) return '/agent/talk';
  if (text.includes('product')) return '/menu';
  return '/agent/business'; // address, hours, services and anything new
}

const LIST_WORDS = ['product'];

function isAboutList(item) {
  const text = item.toLowerCase();
  return LIST_WORDS.some((word) => text.includes(word));
}

// Five steps, the shortest road to a first real customer. Each one says what
// it gets the owner, and how to do it from here.
//   missing          the backend's list of gaps
//   itemsLabel       "Products", in the chosen language
//   triedIt          the agent has had at least one conversation
//   shared           Telegram is connected, or the chat link was copied
export function setupSteps({ missing, itemsLabel, triedIt, shared }) {
  const details = missing.filter((item) => !isAboutList(item));
  const list = missing.filter(isAboutList);
  const listName = itemsLabel.toLowerCase();

  return [
    {
      id: 'create',
      title: t('setupSteps.create.title'),
      text: t('setupSteps.create.text'),
      done: true,
    },
    {
      id: 'details',
      title: t('setupSteps.details.title'),
      // The backend's own sentences, as it wrote them.
      text: details.length
        ? details.map((item) => item.replace(/\.$/, '')).join('. ') + '.'
        : t('setupSteps.details.text'),
      done: details.length === 0,
      to: details.length ? whereToFix(details[0]) : '/agent/business',
      action: t('setupSteps.details.action'),
    },
    {
      id: 'list',
      title: t('setupSteps.list.title', { list: listName }),
      text: t('setupSteps.list.text', { list: listName }),
      done: list.length === 0,
      to: list.length ? whereToFix(list[0]) : '/menu',
      action: t('setupSteps.list.action', { list: listName }),
    },
    {
      id: 'try',
      title: t('setupSteps.try.title'),
      text: t('setupSteps.try.text'),
      done: triedIt,
      opensChat: true,
      action: t('setupSteps.try.action'),
    },
    {
      id: 'share',
      title: t('setupSteps.share.title'),
      text: t('setupSteps.share.text'),
      done: shared,
      to: '/channels',
      action: t('setupSteps.share.action'),
    },
  ];
}

// Copying the chat link is the best sign the owner shared it. Remembered per
// business in this browser only; it just ticks the step.
export function markShared(businessId) {
  try {
    localStorage.setItem(`heydesk:shared:${businessId}`, '1');
  } catch (error) {
    // Private mode: the step stays open, nothing breaks.
  }
}

export function wasShared(businessId) {
  try {
    return localStorage.getItem(`heydesk:shared:${businessId}`) === '1';
  } catch (error) {
    return false;
  }
}
