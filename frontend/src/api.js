const BASE = '/api';

async function req(url, opts = {}) {
  const headers = { 
    'Content-Type': 'application/json',
    ...opts.headers 
  };
  
  // Достаем ключ из localStorage и добавляем в заголовок
  const userKey = localStorage.getItem('deepseek_api_key');
  if (userKey) {
    headers['X-DeepSeek-Key'] = userKey;
  }

  const r = await fetch(BASE + url, {
    ...opts,
    headers,
  });
  if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
  return r.json();
}

export const api = {
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