// Every fetch in the app goes through here, so the base URL, the JSON headers,
// the Bearer token and the error shape are decided in exactly one place.
//
// The backend answers every failure as { error: { code, message, fields? } };
// `fields` maps a config path to what is wrong with it (422 invalid_config).
import i18n, { t } from '../i18n/index.js';

const BASE_URL = '/api';

// The auth store hands over the session's token, and main.js registers what
// should happen when it is rejected, so this file never imports a store (the
// stores import this file).
let authToken = null;
let onUnauthorized = () => {};

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function request(path, { method = 'GET', body } = {}) {
  const token = authToken;
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
  // The language the owner reads, should the backend learn to answer in it.
  headers['Accept-Language'] = i18n.global.locale.value;
  // On Vercel the backend sits behind a free ngrok tunnel, which answers
  // browsers with a warning page unless this header is present.
  headers['ngrok-skip-browser-warning'] = '1';

  let response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body && !isForm ? JSON.stringify(body) : body,
    });
  } catch (networkError) {
    // Offline, or the server is not answering at all: one plain sentence.
    throw new Error(t('errors.network'));
  }

  // A failing proxy answers with HTML, and a 204 has no body at all, so
  // parsing has to be allowed to fail without hiding the status underneath.
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = responseData && responseData.error;
    const error = new Error(
      (detail && detail.message) || t('errors.requestFailed', { status: response.status })
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
