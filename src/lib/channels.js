import { PhChatCircle, PhMessengerLogo, PhMicrophone, PhTelegramLogo, PhWhatsappLogo } from '@phosphor-icons/vue';

import { t } from '../i18n/index.js';

// Where a conversation happened. An unknown channel reads as a chat.
// The messaging apps show their own logo in their own colour: `avatar` for a
// round avatar (white logo on the brand), `color` for the logo on white.
const CHANNELS = {
  web: { icon: PhChatCircle, avatar: 'bg-hover text-ink', color: '' },
  voice: { icon: PhMicrophone, avatar: 'bg-hover text-ink', color: '' },
  telegram: { icon: PhTelegramLogo, avatar: 'bg-telegram text-white', color: 'text-telegram', brand: true },
  messenger: { icon: PhMessengerLogo, avatar: 'bg-messenger text-white', color: 'text-messenger', brand: true },
  whatsapp: { icon: PhWhatsappLogo, avatar: 'bg-whatsapp text-white', color: 'text-whatsapp', brand: true },
};

// The ones a conversation can come from, in the order the filter shows them.
export const CHANNEL_IDS = Object.keys(CHANNELS);

export function channelOf(id) {
  const key = CHANNELS[id] ? id : 'web';
  return {
    ...CHANNELS[key],
    weight: CHANNELS[key].brand ? 'fill' : 'regular',
    label: t(`channels.${key}.label`),
    long: t(`channels.${key}.long`),
  };
}
