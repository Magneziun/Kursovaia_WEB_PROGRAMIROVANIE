const BASE = '/api';

async function req(url, opts = {}) {
  const headers = { 
    'Content-Type': 'application/json',
    ...opts.headers 
  };
  
  const userKey = localStorage.getItem('deepseek_api_key');
  if (userKey) headers['X-DeepSeek-Key'] = userKey;
  
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const r = await fetch(BASE + url, { ...opts, headers });
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem('auth_token'); // Токен протух
      window.location.reload();
    }
    throw new Error(`${r.status}: ${await r.text()}`);
  }
  return r.json();
}


export const api = {
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return req('/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData 
    });
  },
  register: (username, password) => req('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getAchievements: () => req('/auth/me/achievements'),
  generateCharacter: (difficulty) =>
    req('/characters/generate', { method: 'POST', body: JSON.stringify({ difficulty }) }),
  createCharacter: (data) =>
    req('/characters', { method: 'POST', body: JSON.stringify(data) }),
  createSession: (character_id, player) =>
    req('/sessions', { method: 'POST', body: JSON.stringify({ character_id, player }) }),
  getMessages: (id) => req(`/sessions/${id}/messages`),
  sendMessage: (id, content) =>
    req(`/sessions/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
};