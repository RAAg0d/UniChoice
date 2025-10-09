/**
 * Компонент детальной страницы университета
 * 
 * Отображает подробную информацию об университете, включая:
 * - Основную информацию (название, описание, местоположение)
 * - Статистику заявлений (общее количество, за 30 дней, дни с последней подачи)
 * - Средний рейтинг по отзывам
 * - Список специальностей
 * - Отзывы студентов
 * 
 * Функциональность:
 * - Загрузка данных университета по ID
 * - Отображение агрегированной статистики
 * - Навигация к списку университетов
 * - Интеграция с компонентами отзывов и специальностей
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewsSection from './ReviewsSection';     // Компонент отзывов
import SpecialtiesSection from './SpecialtiesSection'; // Компонент специальностей
import './UniversityDetails.css';

const UniversityDetails = ({ user }) => {
  const { id } = useParams();                    // ID университета из URL
  const [university, setUniversity] = useState(null); // Данные университета
  const [isLoading, setIsLoading] = useState(true);   // Состояние загрузки
  const [error, setError] = useState(null);           // Ошибки загрузки
  const navigate = useNavigate();

  // Loads single university details with aggregate stats
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetch(`http://localhost:5000/universities/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка при загрузке данных');
        }
        return response.json();
      })
      .then((data) => {
        setUniversity(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке информации о вузе:', error);
        setError(error.message);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return <div className="loading-spinner">Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  if (!university) {
    return <div>Вуз не найден</div>;
  }

  return (
    <div className="page-container">
      <div className="university-details-container">
        <div className="university-details">
          <button 
            className="back-button" 
            onClick={() => navigate('/universities')}
          >
            Назад к списку вузов
          </button>

          <h1>{university.name}</h1>
          <p><strong>Описание:</strong> {university.description}</p>
          <p><strong>Местоположение:</strong> {university.location}</p>
          <div className="university-stats">
            <p><strong>Оценка:</strong> {university.average_rating || 'Нет оценок'}</p>
            <p><strong>Заявлений всего:</strong> {university.total_applications ?? 0}</p>
            <p><strong>За последние 30 дней:</strong> {university.applications_last_30_days ?? 0}</p>
            <p><strong>Последнее заявление:</strong> {
              university.days_since_last_application === null || university.days_since_last_application === undefined
                ? 'нет данных'
                : `${university.days_since_last_application} дн. назад`
            }</p>
          </div>
          
          <SpecialtiesSection universityId={id} user={user} />
          
          <ReviewsSection user={user} />
        </div>
      </div>
    </div>
  );
};

export default UniversityDetails;