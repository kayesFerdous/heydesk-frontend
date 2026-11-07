// Every fetch in the app goes through here, so the base URL, the JSON headers,
// and the error shape are decided in exactly one place.
//
// The backend answers every failure as { error: { code, message, fields? } };
// `fields` maps a config path to what is wrong with it (422 invalid_config).
import i18n, { t } from '../i18n/index.js';

const BASE_URL = '/api';

// The browser sends the session cookie by itself; scripts can never read it. The
// auth store says whether someone is signed in, and main.js registers what should
// happen when the session is rejected, so this file never imports a store (the
// stores import this file).
let signedIn = false;
let viewedBusiness = null;
let onUnauthorized = () => {};

export function setSignedIn(next) {
  signedIn = next;
}

// The business an admin is looking at (backend D23): sent as X-Business, so the
// owner's pages show that business. null for owners and for the admin's own pages.
export function setViewedBusiness(businessId) {
  viewedBusiness = businessId;
}

export function isSignedIn() {
  return signedIn;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// The headers every call sends: the business an admin looks at, the
// language, and the ngrok one.
function baseHeaders() {
  const headers = {};
  if (viewedBusiness) {
    headers['X-Business'] = viewedBusiness;
  }
  // The language the owner reads, should the backend learn to answer in it.
  headers['Accept-Language'] = i18n.global.locale.value;
  // On Vercel the backend sits behind a free ngrok tunnel, which answers
  // browsers with a warning page unless this header is present.
  headers['ngrok-skip-browser-warning'] = '1';
  return headers;
}

export async function request(path, { method = 'GET', body } = {}) {
  const wasSignedIn = signedIn;
  const headers = baseHeaders();

  // A file upload is a FormData: the browser sets its own Content-Type (with
  // the multipart boundary), so only JSON bodies get the header and stringify.
  const isForm = body instanceof FormData;
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json';
  }

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

    // A rejected session (a wrong password at sign-in is also a 401): it is over.
    if (response.status === 401 && wasSignedIn) {
      onUnauthorized();
    }
    throw error;
  }

  return responseData;
}

// A stream the server holds open (text/event-stream). This is a fetch, not an
// EventSource, so it can send the headers above; the caller reads it with
// `response.body` and ends it with `signal`. A failure to open
// throws like `request` does.
export async function openStream(path, signal) {
  const wasSignedIn = signedIn;
  let response;
  try {
    response = await fetch(BASE_URL + path, {
      headers: { ...baseHeaders(), Accept: 'text/event-stream' },
      signal,
    });
  } catch (networkError) {
    if (signal.aborted) throw networkError;
    throw new Error(t('errors.network'));
  }
  if (!response.ok || !response.body) {
    const responseData = await response.json().catch(() => null);
    const detail = responseData && responseData.error;
    const error = new Error(
      (detail && detail.message) || t('errors.requestFailed', { status: response.status })
    );
    error.status = response.status;
    if (response.status === 401 && wasSignedIn) {
      onUnauthorized();
    }
    throw error;
  }
  return response;
}
