import { request } from './client.js';

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function signup(email, password, workspaceName) {
  return request('/auth/signup', {
    method: 'POST',
    body: { email, password, workspace_name: workspaceName },
  });
}

// Your own password; the API answers 204, or 403 if the current one is wrong.
export function changePassword(currentPassword, newPassword) {
  return request('/auth/password', {
    method: 'PUT',
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export function fetchMe() {
  return request('/auth/me');
}
