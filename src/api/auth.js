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

export function fetchMe() {
  return request('/auth/me');
}
