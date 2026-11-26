import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import SetupScreen from './components/SetupScreen';
import ChatScreen from './components/ChatScreen';

export default function App() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState('welcome'); // welcome, setup
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <>
      <button className="theme-toggle glass" onClick={toggleTheme}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {screen === 'welcome' && (
        <WelcomeScreen onStart={() => setScreen('setup')} />
      )}

      {screen === 'setup' && !session && (
        <SetupScreen onStart={setSession} />
      )}

      {session && (
        <ChatScreen 
          initialSession={session} 
          onExit={() => { setSession(null); setScreen('setup'); }} 
        />
      )}
    </>
  );
}