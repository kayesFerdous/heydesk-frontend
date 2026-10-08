// A voice call to the agent over WebRTC. The browser makes an offer (its
// microphone, plus every ICE candidate it found), the backend answers, and the
// agent's voice comes back as an audio track. The public key is the credential.
import { request } from './client.js';

// STUN, plus a TURN relay when the backend has one, so a caller behind a
// strict network still connects.
export function fetchIceServers() {
  return request('/voice/ice');
}

export function sendOffer(publicKey, description) {
  return request(`/voice/offer?key=${encodeURIComponent(publicKey)}`, {
    method: 'POST',
    body: { sdp: description.sdp, type: description.type },
  });
}
