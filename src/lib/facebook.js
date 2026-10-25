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

// Opens Facebook's login window. The user token, or null if the owner closed it.
export async function facebookLogin(appId, scope) {
  const FB = await loadSdk(appId);
  return new Promise((resolve) => {
    FB.login((response) => resolve(response.authResponse?.accessToken || null), { scope });
  });
}
