import { request } from './client.js';

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

// Not logged in yet: the API emails a 6-digit code, and verifyEmail logs them in (backend D94).
export function signup(email, password, workspaceName) {
  return request('/auth/signup', {
    method: 'POST',
    body: { email, password, workspace_name: workspaceName },
  });
}

// The code from the signup email: sets the session cookie, or 403 if it is wrong or expired.
export function verifyEmail(email, code) {
  return request('/auth/verify', { method: 'POST', body: { email, code } });
}

// Always 204, whether or not the email has an account.
export function resendCode(email) {
  return request('/auth/verify/resend', { method: 'POST', body: { email } });
}

// Always 204: emails a reset code if the account exists.
export function forgotPassword(email) {
  return request('/auth/forgot', { method: 'POST', body: { email } });
}

// The emailed code and a new password: sets the session cookie, or 403 if the code is wrong.
export function resetPassword(email, code, newPassword) {
  return request('/auth/reset', {
    method: 'POST',
    body: { email, code, new_password: newPassword },
  });
}

// Your own password; the API answers 204, or 403 if the current one is wrong.
export function changePassword(currentPassword, newPassword) {
  return request('/auth/password', {
    method: 'PUT',
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

// Clears the session cookie, which scripts here cannot do.
export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export function fetchMe() {
  return request('/auth/me');
}
