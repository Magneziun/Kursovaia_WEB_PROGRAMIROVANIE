import { useEffect, useState } from 'react';
import { api } from '../api';

const ACHIEVEMENT_DATA = {
  "first_message": { title: "Первые шаги", desc: "Отправьте свое первое сообщение" },
  "first_negative": { title: "Ничего страшного", desc: "Впервые получить отрицательные очки" },
  "first_ghost": { title: "Поклевка сорвалась", desc: "Вы упустили свой шанс, попробуйте снова" },
  "score_over_5": { title: "Это было очень COLD 🥶", desc: "Впервые получить больше +5 очков" },
  "first_win": { title: "Первый улов", desc: "Удачно пригласить девушку на свидание" }
};

export default function ProfileScreen({ onBack }) {
  const [unlocked, setUnlocked] = useState([]);

  useEffect(() => {
    api.getAchievements().then(res => {
      setUnlocked(res.map(a => a.code));
    });
  }, []);

  return (
    <div className="container fade-in">
      <header className="chat-header glass" style={{marginBottom: '20px'}}>
        <h2>🏆 Достижения</h2>
        <button className="btn-secondary" onClick={onBack}>Назад</button>
      </header>
      
      <div className="achievements-list">
        {Object.entries(ACHIEVEMENT_DATA).map(([code, data]) => {
          const isUnlocked = unlocked.includes(code);
          return (
            <div key={code} className={`achievement-item glass ${isUnlocked ? '' : 'locked'}`}>
              <img src={`/images/achievements/${code}.png`} alt={data.title} className="ach-img" onError={(e) => e.target.src = 'https://via.placeholder.com/60?text=🏆'} />
              <div className="ach-info">
                <h3>{data.title}</h3>
                <p>{data.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}