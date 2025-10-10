// Компонент нижней секции с кнопками для случайного вуза и топ-вуза
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomSection.css';

const BottomSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Состояние загрузки для кнопок
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [isLoadingTop, setIsLoadingTop] = useState(false);

  // Обработчик для получения случайного вуза
  const handleRandomUniversity = async () => {
    setIsLoadingRandom(true);
    try {
      // Запрос к API для получения случайного вуза
      const response = await fetch('http://localhost:5000/universities/random');
      if (!response.ok) throw new Error('Не удалось загрузить данные');
      
      const randomUniversity = await response.json();
      // Переход на страницу случайного вуза
      navigate(`/universities/${randomUniversity.universities_id}`);
    } catch (error) {
      console.error('Ошибка при получении случайного вуза:', error);
      alert('Не удалось загрузить случайный вуз. Попробуйте позже.');
    } finally {
      setIsLoadingRandom(false);
    }
  };

  // Обработчик для получения вуза с наивысшим рейтингом
  const handleTopUniversity = async () => {
    setIsLoadingTop(true);
    try {
      // Запрос к API для получения топ-вуза
      const response = await fetch('http://localhost:5000/top-university');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.details || 'Не удалось загрузить данные');
      }

      if (!data || !data.universities_id) {
        throw new Error('Вузы не найдены');
      }

      // Формирование сообщения с информацией о вузе
      const message = data.review_count > 0
        ? `Переходим к вузу "${data.name}" с рейтингом ${data.average_rating}`
        : `Переходим к вузу "${data.name}" (пока без отзывов)`;

      console.log(message);
      // Переход на страницу топ-вуза
      navigate(`/universities/${data.universities_id}`);
    } catch (error) {
      console.error('Детальная ошибка:', error);
      if (error.message === 'Вузы не найдены') {
        alert('В базе данных пока нет вузов');
      } else {
        alert(error.message);
      }
    } finally {
      setIsLoadingTop(false);
    }
  };

  if (location.pathname === '/admin') return null;

  return (
    <div className="bottom-section">
      <div className="bottom-row">
        <div className="random-university">
          <div>
            <h3>Случайный вуз, посмотри какой выпадет тебе!</h3>
            <p>Нажмите кнопку, чтобы система выбрала для вас вуз случайным образом</p>
          </div>
          <button onClick={handleRandomUniversity} disabled={isLoadingRandom}>
            {isLoadingRandom ? 'Загрузка...' : 'Попытать удачу'}
          </button>
        </div>
        
        <div className="top-university">
          <div>
            <h3>Вуз с наивысшим рейтингом!</h3>
            <p>Узнайте, какой вуз имеет самый высокий рейтинг на основе отзывов пользователей</p>
          </div>
          <button onClick={handleTopUniversity} disabled={isLoadingTop}>
            {isLoadingTop ? 'Загрузка...' : 'Увидеть топ-вуз'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomSection;