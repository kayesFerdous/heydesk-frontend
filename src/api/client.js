// Every fetch in the app goes through here, so the base URL, the JSON headers,
// the Bearer token and the error shape are decided in exactly one place.
//
// The backend answers every failure as { error: { code, message, fields? } };
// `fields` maps a config path to what is wrong with it (422 invalid_config).
const BASE_URL = '/api';

// main.js registers what should happen when the token is rejected, so this file
// does not have to import the store (the store imports this file).
let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};

  // A file upload is a FormData: the browser sets its own Content-Type (with
  // the multipart boundary), so only JSON bodies get the header and stringify.
  const isForm = body instanceof FormData;
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body && !isForm ? JSON.stringify(body) : body,
  });

  // A failing proxy answers with HTML, and a 204 has no body at all, so
  // parsing has to be allowed to fail without hiding the status underneath.
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = responseData && responseData.error;
    const error = new Error(
      (detail && detail.message) ||
        `Request failed with status ${response.status}.`
    );
    error.status = response.status;
    error.code = detail && detail.code;
    error.fields = detail && detail.fields;

    // A rejected token on a call that sent one: the session is over.
    if (response.status === 401 && token) {
      onUnauthorized();
    }
    throw error;
  }

  return responseData;
}
