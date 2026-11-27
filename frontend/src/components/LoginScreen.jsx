import { useState } from 'react';
import { api } from '../api';

export default function LoginScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = isRegister 
        ? await api.register(username, password)
        : await api.login(username, password);
        
      localStorage.setItem('auth_token', res.access_token);
      onLogin();
    } catch (err) {
      setError('Ошибка: неверный логин или пароль');
    }
  };

  return (
    <div className="welcome-container">
      <form className="welcome-content glass" onSubmit={handleSubmit}>
        <h2 className="gradient-text">{isRegister ? 'Регистрация' : 'Вход'}</h2>
        <div style={{marginBottom: '15px'}}>
          <input className="glass-input" placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div style={{marginBottom: '15px'}}>
          <input className="glass-input" type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div className="error" style={{marginBottom: '15px'}}>{error}</div>}
        <button type="submit" className="btn-primary big">{isRegister ? 'Создать аккаунт' : 'Войти'}</button>
        <p style={{marginTop: '15px', cursor: 'pointer', color: 'var(--accent)'}} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </p>
      </form>
    </div>
  );
}