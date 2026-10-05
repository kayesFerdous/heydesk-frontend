// The visitor-facing chat is a public endpoint: the agent's public key is the
// whole credential. A reply streams back as server-sent events:
//   open {conversation_id}  token {text}  status {label}
//   handoff {message, phone, email}  done {interrupted}  error {message}
import { request } from './client.js';

export function fetchChatAgent(publicKey) {
  return request(`/chat/${publicKey}`);
}

export async function streamChat(publicKey, message, conversationId, handlers) {
  const response = await fetch(`/api/chat/${publicKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      (data && data.error && data.error.message) ||
        `Request failed with status ${response.status}.`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Frames end with a blank line; one frame may arrive split across reads.
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let end;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      dispatch(frame, handlers);
    }
  }
}

function dispatch(frame, handlers) {
  let event = 'message';
  let data = '';
  frame.split('\n').forEach((line) => {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  });
  const handler = handlers[event];
  if (handler && data) {
    handler(JSON.parse(data));
  }
}
