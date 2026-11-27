import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import SetupScreen from './components/SetupScreen';
import ChatScreen from './components/ChatScreen';
import LoginScreen from './components/LoginScreen';
import ProfileScreen from './components/ProfileScreen';

export default function App() {
  const [session, setSession] = useState(null);
  // Начинаем ВСЕГДА с экрана welcome
  const [screen, setScreen] = useState('welcome'); 
  const [theme, setTheme] = useState('dark');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('auth_token'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    console.log("Текущий экран:", screen, "| Авторизован:", isLoggedIn);
  }, [theme, screen, isLoggedIn]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleWelcomeStart = () => {
    if (isLoggedIn) {
      setScreen('setup');
    } else {
      setScreen('login'); // Перенаправляем на логин, если нет токена
    }
  };

  return (
    <>
      <div className="top-bar glass" style={{position: 'fixed', top: 20, right: 20, display: 'flex', gap: '10px', padding: '8px', zIndex: 100, borderRadius: '12px'}}>
        {isLoggedIn && screen !== 'profile' && screen !== 'welcome' && screen !== 'login' && (
          <button className="btn-secondary" onClick={() => setScreen('profile')}>🏆 Профиль</button>
        )}
        <button className="theme-toggle glass" style={{position: 'static'}} onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {isLoggedIn && (
          <button className="btn-secondary" onClick={() => { localStorage.removeItem('auth_token'); setIsLoggedIn(false); setScreen('welcome'); }}>Выйти</button>
        )}
      </div>

      {screen === 'welcome' && <WelcomeScreen onStart={handleWelcomeStart} />}
      
      {screen === 'login' && (
        <LoginScreen onLogin={() => { setIsLoggedIn(true); setScreen('setup'); }} />
      )}
      
      {screen === 'profile' && (
        <ProfileScreen onBack={() => setScreen('setup')} />
      )}
      
      {screen === 'setup' && !session && (
        <SetupScreen onStart={setSession} />
      )}
      
      {session && (
        <ChatScreen initialSession={session} onExit={() => { setSession(null); setScreen('setup'); }} />
      )}
    </>
  );
}