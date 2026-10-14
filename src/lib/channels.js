import { PhChatCircle, PhMessengerLogo, PhMicrophone, PhTelegramLogo } from '@phosphor-icons/vue';

import { t } from '../i18n/index.js';

// Where a conversation happened. An unknown channel reads as a chat.
const ICONS = { web: PhChatCircle, voice: PhMicrophone, telegram: PhTelegramLogo, messenger: PhMessengerLogo };

export function channelOf(id) {
  const key = ICONS[id] ? id : 'web';
  return {
    label: t(`channels.${key}.label`),
    long: t(`channels.${key}.long`),
    icon: ICONS[key],
  };
}
