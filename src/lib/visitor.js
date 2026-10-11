// Who this browser is, for the chat's limits (backend D51): a random token
// kept in the browser. The chat and voice calls both send it, so the backend
// can count one visitor's turns and block one who is only passing the time.
export const visitorId = (() => {
  try {
    let id = localStorage.getItem('heydesk-visitor');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('heydesk-visitor', id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // storage is blocked: a new visitor each page load
  }
})();
