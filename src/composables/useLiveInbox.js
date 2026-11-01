import { watch, onBeforeUnmount } from 'vue';

import { openStream } from '../api/client.js';
import { useInboxStore } from '../stores/inbox.js';

const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

// New work shows without a reload (backend D158): while `enabled` is true one
// stream is held open to GET /conversations/live, and the server sends a
// `changed` event for each conversation that changed, so nothing polls. After a
// reconnect the events of the gap are lost, so everything is asked again once.
//
//   useLiveInbox(computed(() => watching))
export function useLiveInbox(enabled) {
  const inbox = useInboxStore();
  let controller = null;

  // One frame's `event:` name. Its data (which chat) isn't needed: the store
  // fetches the counts and the list once for the frames that come together.
  function eventOf(frame) {
    const line = frame.split('\n').find((l) => l.startsWith('event:'));
    return line ? line.slice(6).trim() : 'message';
  }

  // Reads frames until the stream ends. Returns whether it ever opened.
  async function read(signal, reconnected) {
    const response = await openStream('/conversations/live', signal);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let opened = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return opened;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, '\n');
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const event = eventOf(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (event === 'open') {
          opened = true;
          if (reconnected) inbox.changed();
        } else if (event === 'changed') {
          inbox.changed();
        }
      }
    }
  }

  async function run(signal) {
    let delay = FIRST_RETRY_MS;
    let reconnected = false;
    while (!signal.aborted) {
      try {
        if (await read(signal, reconnected)) delay = FIRST_RETRY_MS;
      } catch (err) {
        if (signal.aborted || err.status === 401) return;
      }
      reconnected = true;
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, delay);
        signal.addEventListener('abort', () => (clearTimeout(timer), resolve()), { once: true });
      });
      delay = Math.min(delay * 2, MAX_RETRY_MS);
    }
  }

  function stop() {
    controller?.abort();
    controller = null;
  }

  watch(
    enabled,
    (on) => {
      stop();
      if (on) {
        controller = new AbortController();
        run(controller.signal);
      }
    },
    { immediate: true },
  );
  onBeforeUnmount(stop);
}
