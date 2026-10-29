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

  // The text of one frame: its `event:` name and its `data:` line.
  function parse(frame) {
    let event = 'message';
    let data = '';
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data = line.slice(5).trim();
    }
    return { event, data };
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
        const { event, data } = parse(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (event === 'open') {
          opened = true;
          if (reconnected) inbox.changed(null);
        } else if (event === 'changed') {
          try {
            inbox.changed(JSON.parse(data).conversation_id);
          } catch (err) {
            inbox.changed(null);
          }
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
