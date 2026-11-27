const variants = {
  'score-up': [
    'score-up.mp3', 
    'score-up1.mp3', 
    'score-up2.mp3',
    'score-up3.mp3',  
    'score-up4.mp3'  
  ],
  'score-down': [
    'score-down.mp3', 
    'score-down1.mp3', 
    'score-down2.mp3',
    'score-down3.mp3', // <-- Добавили новый
    'score-down4.mp3'
  ],
  'game-start': ['game-start.mp3'],
  'game-exit': ['game-exit.mp3'],
  'game-win': ['game-win.mp3'],
  'game-lose': ['game-lose.mp3'],
  'achievement': ['achievement.mp3'],
};

export const playSound = (type) => {
  try {
    const files = variants[type];
    if (!files) return;
    
    // Выбираем случайный файл из доступных для этого типа
    const randomFile = files[Math.floor(Math.random() * files.length)];
    
    const audio = new Audio(`/sounds/${randomFile}`);
    audio.volume = 0.5; // Громкость 50%
    
    audio.play().catch(() => {
      // Игнорируем ошибки, если браузер блокирует автовоспроизведение 
      // или если файла физически нет в папке
    });
  } catch (e) {
    console.log('Sound error:', e);
  }
};