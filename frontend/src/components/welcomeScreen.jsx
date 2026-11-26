import { useState } from 'react';

export default function WelcomeScreen({ onStart }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('deepseek_api_key') || '');
  const [showKey, setShowKey] = useState(false);

  const handleStart = () => {
    // Сохраняем ключ в браузере
    if (apiKey.trim()) {
      localStorage.setItem('deepseek_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('deepseek_api_key');
    }
    onStart();
  };

  return (
    <div className="welcome-container">
      <div className="welcome-content glass">
        <h1 className="gradient-text">Dating Sim</h1>
        <p>Погрузись в реалистичный симулятор общения. Сможешь ли ты растопить её сердце?</p>
        
        <div className="api-key-section">
          <label className="small muted">Ваш DeepSeek API Ключ (опционально)</label>
          <div className="api-input-wrapper glass">
            <input 
              type={showKey ? "text" : "password"} 
              placeholder="sk-..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button className="eye-btn" onClick={() => setShowKey(!showKey)}>
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="small muted" style={{marginTop: '8px'}}>
            Если не укажете, будет использован ключ сервера (если он есть).
          </p>
        </div>

        <button className="primary big pulse" onClick={handleStart}>
          Начать игру
        </button>
      </div>
    </div>
  );
}