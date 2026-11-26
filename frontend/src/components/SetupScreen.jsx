import { useState } from 'react';
import { api } from '../api';

const defaultPlayer = { name: 'Алекс', age: 25, height: 180, weight: 75, attractiveness: 6, intelligence: 6 };
const defaultManual = {
  name: 'Алиса', age: 24, archetype: 'интеллектуалка',
  personality: 'Любит книги, кофе и умные разговоры. Не терпит банальностей.',
  interests: ['книги', 'кофе', 'психология'],
  unique_summary: 'Тихая, но с острым умом. Скучно с ней не будет — если найдёшь подход.',
};

export default function SetupScreen({ onStart }) {
  const [mode, setMode] = useState('random');
  const [difficulty, setDifficulty] = useState('medium');
  const [busy, setBusy] = useState(false);
  const [character, setCharacter] = useState(null);
  const [manual, setManual] = useState(defaultManual);
  const [player, setPlayer] = useState(defaultPlayer);
  const [error, setError] = useState(null);

  const randomize = () => setPlayer({
    name: player.name || 'Алекс',
    age: 18 + Math.floor(Math.random() * 15),
    height: 165 + Math.floor(Math.random() * 30),
    weight: 60 + Math.floor(Math.random() * 40),
    attractiveness: 1 + Math.floor(Math.random() * 10),
    intelligence: 1 + Math.floor(Math.random() * 10),
  });

  const run = async (fn) => {
    setError(null); setBusy(true);
    try { setCharacter(await fn()); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const handleStart = async () => {
    if (!character) return;
    setBusy(true); setError(null);
    try { onStart(await api.createSession(character.id, player)); } 
    catch (e) { setError(e.message); } finally { setBusy(false); }
    const handleStart = async () => {
    if (!character) return;
    setBusy(true); setError(null);
    playSound('game-start'); // <--- ДОБАВЛЯЕМ ЗВУК СТАРТА
    try { onStart(await api.createSession(character.id, player)); } 
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  };

  return (
    <div className="container fade-in">
      <h1 className="gradient-text">Настройки</h1>
      
      <section className="card glass">
        <h2>1. Она</h2>
        <div className="row">
          <label>Сложность:</label>
          <select className="glass-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Лёгкая</option>
            <option value="medium">Средняя</option>
            <option value="hard">Сложная</option>
          </select>
        </div>
        <div className="toggle-group">
  <label className="toggle-btn">
    <input 
      type="radio" 
      checked={mode === 'random'} 
      onChange={() => setMode('random')} 
    />
     Сгенерировать
  </label>
  <label className="toggle-btn">
    <input 
      type="radio" 
      checked={mode === 'manual'} 
      onChange={() => setMode('manual')} 
    />
     Вручную
  </label>
</div>

        {mode === 'random' ? (
          <button className="btn-primary" disabled={busy} onClick={() => run(() => api.generateCharacter(difficulty))}>
            {busy ? 'Генерирую…' : ' Сгенерировать персонажа'}
          </button>
        ) : (
          <div className="grid">
            <input className="glass-input" placeholder="Имя" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
            <input className="glass-input" type="number" placeholder="Возраст" value={manual.age} onChange={(e) => setManual({ ...manual, age: +e.target.value })} />
            <input className="glass-input" placeholder="Архетип" value={manual.archetype} onChange={(e) => setManual({ ...manual, archetype: e.target.value })} />
            <textarea className="glass-input" placeholder="Личность" value={manual.personality} onChange={(e) => setManual({ ...manual, personality: e.target.value })} />
            <button className="btn-primary" disabled={busy} onClick={() => run(() => api.createCharacter({ ...manual, difficulty }))}>Создать</button>
          </div>
        )}

        {character && (
          <div className="preview glass">
            <h3>{character.name}, {character.age}</h3>
            <div className="muted small">{character.archetype} · {character.difficulty}</div>
            <p>{character.unique_summary}</p>
          </div>
        )}
      </section>

      <section className="card glass">
        <h2>2. Ты</h2>
        <div className="row"><button className="btn-secondary" onClick={randomize}> Рандом</button></div>
        <div className="grid">
          <label>Имя <input className="glass-input" value={player.name} onChange={(e) => setPlayer({ ...player, name: e.target.value })} /></label>
          <Slider label="Возраст" min={18} max={80} value={player.age} onChange={(v) => setPlayer({ ...player, age: v })} />
          <Slider label="Рост, см" min={140} max={220} value={player.height} onChange={(v) => setPlayer({ ...player, height: v })} />
          <Slider label="Вес, кг" min={40} max={200} value={player.weight} onChange={(v) => setPlayer({ ...player, weight: v })} />
          <Slider label="Привлекательность" min={1} max={10} value={player.attractiveness} onChange={(v) => setPlayer({ ...player, attractiveness: v })} />
          <Slider label="Интеллект" min={1} max={10} value={player.intelligence} onChange={(v) => setPlayer({ ...player, intelligence: v })} />
        </div>
      </section>

      {error && <div className="error glass">{error}</div>}

      <button className="primary big glow" disabled={!character || busy || !player.name.trim()} onClick={handleStart}>
        {busy ? 'Создаю…' : '▶ Начать диалог'}
      </button>
    </div>
  );
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <label className="slider">
      <span>{label}: <b>{value}</b></span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} />
    </label>
  );
}