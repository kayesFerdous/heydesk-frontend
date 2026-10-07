import { PhChatCircle, PhMicrophone, PhTelegramLogo } from '@phosphor-icons/vue';

// Where a conversation happened. An unknown channel reads as a chat.
const CHANNELS = {
  web: { label: 'Chat', long: 'Chat', icon: PhChatCircle },
  voice: { label: 'Voice', long: 'Voice call', icon: PhMicrophone },
  telegram: { label: 'Telegram', long: 'Telegram', icon: PhTelegramLogo },
};

export function channelOf(id) {
  return CHANNELS[id] || CHANNELS.web;
}
