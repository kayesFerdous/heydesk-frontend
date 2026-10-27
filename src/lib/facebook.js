// Facebook's login, for Connect with Facebook (backend D118). Facebook's own
// window asks the owner to log in and pick their Pages; we get back a short
// token that the server swaps for the Pages' tokens. Nothing to copy.

let loading = null;

// Loads Facebook's JS SDK once and sets it up with our Meta app's id.
function loadSdk(appId) {
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      window.fbAsyncInit = () => {
        window.FB.init({ appId, version: 'v23.0' });
        resolve(window.FB);
      };
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.onerror = () => {
        loading = null; // a blocker or no network: the next click tries again
        reject(new Error('facebook'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

// Opens Facebook's login window. `configId` is our Facebook Login for Business
// configuration, which holds the permissions (backend D119). The user token, or
// null if the owner closed it.
export async function facebookLogin(appId, configId) {
  const FB = await loadSdk(appId);
  return new Promise((resolve) => {
    FB.login((response) => resolve(response.authResponse?.accessToken || null), {
      config_id: configId,
    });
  });
}

// Opens Meta's Embedded Signup window (backend D155), where the owner adds and
// verifies their WhatsApp number. The code comes to FB.login's callback; the
// account's and number's ids come in a message from Facebook's window, usually
// first. `{code, accountId, phoneId}`, or null if the owner closed it before the end.
export async function whatsappSignup(appId, configId) {
  const FB = await loadSdk(appId);
  return new Promise((resolve) => {
    let ids = null;
    let code = null;
    let timer = 0;
    const done = (result) => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
      resolve(result);
    };
    const onMessage = (event) => {
      if (!event.origin.endsWith('facebook.com') || typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'WA_EMBEDDED_SIGNUP' || data.event !== 'FINISH') return;
        ids = { accountId: data.data.waba_id, phoneId: data.data.phone_number_id };
        if (code) done({ code, ...ids });
      } catch {
        // another of Facebook's messages, not JSON
      }
    };
    window.addEventListener('message', onMessage);
    FB.login(
      (response) => {
        code = response.authResponse?.code || null;
        if (!code) return done(null); // closed the window
        if (ids) return done({ code, ...ids });
        timer = window.setTimeout(() => done(null), 5000); // the ids never came
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { version: 'v4', sessionInfoVersion: '3', setup: {} },
      },
    );
  });
}
