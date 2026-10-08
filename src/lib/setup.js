// The first-run checklist on Home, and where each gap in the agent is fixed.
//
// The backend's `missing` list is plain sentences ("Add your opening hours.").
// whereToFix() sends each one to the screen that fills it in.
export function whereToFix(item) {
  const text = item.toLowerCase();
  if (text.includes('hours')) return '/agent/hours';
  if (text.includes('phone') || text.includes('email') || text.includes('person')) return '/agent/hours';
  if (text.includes('menu') || text.includes('doctor')) return '/menu';
  return '/agent/profile'; // address, services and anything new
}

const LIST_WORDS = ['menu', 'doctor', 'service'];

function isAboutList(item) {
  const text = item.toLowerCase();
  return LIST_WORDS.some((word) => text.includes(word));
}

// Five steps, the shortest road to a first real customer. Each one says what
// it gets the owner, and how to do it from here.
//   missing          the backend's list of gaps
//   itemsLabel       "Menu", "Doctors" or "Services"
//   triedIt          the agent has had at least one conversation
//   shared           Telegram is connected, or the chat link was copied
export function setupSteps({ missing, itemsLabel, triedIt, shared }) {
  const details = missing.filter((item) => !isAboutList(item));
  const list = missing.filter(isAboutList);
  const listName = itemsLabel.toLowerCase();

  return [
    {
      id: 'create',
      title: 'Create your agent',
      text: 'It answers customers the moment they write.',
      done: true,
    },
    {
      id: 'details',
      title: 'Add your business details',
      text: details.length
        ? details.map((item) => item.replace(/\.$/, '')).join('. ') + '.'
        : 'Address, opening hours and a number for when someone needs a person.',
      done: details.length === 0,
      to: details.length ? whereToFix(details[0]) : '/agent/profile',
      action: 'Add details',
    },
    {
      id: 'list',
      title: `Add your ${listName}`,
      text: `Your agent only offers what is on your ${listName}, at the prices you set.`,
      done: list.length === 0,
      to: list.length ? whereToFix(list[0]) : '/menu',
      action: `Add ${listName}`,
    },
    {
      id: 'try',
      title: 'Try your agent',
      text: 'Chat with it the way a customer would. Test chats show up like real ones.',
      done: triedIt,
      opensChat: true,
      action: 'Try it now',
    },
    {
      id: 'share',
      title: 'Share it with customers',
      text: 'Put your chat link on your website or social pages, or connect Telegram.',
      done: shared,
      to: '/channels',
      action: 'Open channels',
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
