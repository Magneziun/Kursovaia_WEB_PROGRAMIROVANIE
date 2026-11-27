import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { playSound } from '../utils/sound';

export default function ChatScreen({ initialSession, onExit }) {
  const [session, setSession] = useState(initialSession);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  
  // Для уведомлений (Toasts)
  const [toasts, setToasts] = useState([]);
  
  // Для всплывающих баллов
  const [floatingScores, setFloatingScores] = useState([]);

  const endRef = useRef(null);

  useEffect(() => {
    api.getMessages(session.id).then(setMessages).catch(e => setError(String(e)));
  }, [session.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const addToast = (text) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  };

  const send = async () => {
    const content = input.trim();
    if (!content || sending || session.status !== 'active') return;
    setInput(''); setSending(true); setError(null);

    const temp = { id: -Date.now(), role: 'user', content, score_delta: 0 };
    setMessages(m => [...m, temp]);

    try {
      const res = await api.sendMessage(session.id, content);
      
      const assistant = { id: -Date.now() - 1, role: 'assistant', content: res.reply, score_delta: res.score };
      setMessages(m => [...m.filter(x => x.id !== temp.id), temp, assistant]);
      
      setSession({ 
        ...session, 
        status: res.status, 
        total_score: res.total_score, 
        engagement: res.engagement, 
        turn_count: res.turn_count 
      });
            // Проверяем новые ачивки
      if (res.new_achievements && res.new_achievements.length > 0) {
        res.new_achievements.forEach(code => {
          playSound('achievement');
          // Специальный тост для ачивки
          const achToast = { id: Date.now() + code, text: `🏆 Разблокировано достижение!`, isAchievement: true };
          setToasts(prev => [...prev, achToast]);
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== achToast.id)), 5000);
        });
      }

      // 1. Показываем уведомление с комментарием ИИ
      if (res.reason) {
        addToast(`ИИ: ${res.reason} (Оценка: ${res.score > 0 ? '+' : ''}${res.score})`);
      }

      // 2. Запускаем звук и анимацию баллов
      if (res.score > 0) playSound('score-up');
      if (res.score < 0) playSound('score-down');
      
      if (res.score !== 0) {
        const floatId = Date.now();
        setFloatingScores(prev => [...prev, { id: floatId, val: res.score }]);
        setTimeout(() => {
          setFloatingScores(prev => prev.filter(f => f.id !== floatId));
        }, 1500);
      }

      // Звуки завершения игры
      if (res.status === 'won') playSound('game-win');
      if (res.status === 'ghosted') playSound('game-lose');

    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  // Обертка для кнопок выхода
  const handleExitClick = () => {
    playSound('game-exit');
    onExit();
  };

  const c = session.character;
  const progress = Math.max(0, Math.min(100, (session.total_score / c.date_threshold) * 100));
  const eng = Math.max(0, Math.min(100, (session.engagement / 20) * 100));
  const over = session.status !== 'active';

  return (
    <div className="container chat fade-in">
      {/* Контейнер для всплывающих уведомлений */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast glass slide-in-right ${t.isAchievement ? 'toast-ach' : ''}`}>
            {t.text}
          </div>
        ))}
      </div>

      {/* Анимация всплывающих баллов */}
      {floatingScores.map(f => (
        <div key={f.id} className={`floating-score ${f.val > 0 ? 'pos' : 'neg'}`}>
          {f.val > 0 ? `+${f.val}` : f.val} AURA
        </div>
      ))}

      <header className="chat-header glass">
        <div>
          <h2>{c.name}, {c.age}</h2>
          <div className="muted small">{c.archetype} · {c.difficulty}</div>
        </div>
        <button className="btn-secondary" onClick={handleExitClick}>Выйти</button>
      </header>

      <div className="bars glass">
        <div>
          <div className="muted small">Прогресс: {session.total_score}/{c.date_threshold} Ауры</div>
          <div className="bar"><div className="fill green" style={{ width: `${progress}%` }} /></div>
        </div>
        <div>
          <div className="muted small">Интерес: {session.engagement}/20</div>
          <div className="bar"><div className="fill orange" style={{ width: `${eng}%` }} /></div>
        </div>
      </div>

      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={`msg ${m.role} pop-in`}>
            <div className="bubble glass">{m.content}</div>
          </div>
        ))}
        {sending && <div className="msg assistant"><div className="bubble glass typing">печатает…</div></div>}
        <div ref={endRef} />
      </div>

      {over ? (
        <div className={`result glass ${session.status === 'won' ? 'win' : 'lose'}`}>
          {session.status === 'won' ? <h2>🎉 хороший улов! </h2> : <h2>💀 Это очень плохо</h2>}
          <button className="btn-primary" onClick={handleExitClick}>В меню</button>
        </div>
      ) : (
        <div className="composer glass">
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)} placeholder="Напиши сообщение…"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button className="btn-primary" onClick={send} disabled={sending || !input.trim()}>→</button>
        </div>
      )}

      {error && <div className="error glass">{error}</div>}
    </div>
  );
}