import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewsSection from './ReviewsSection';
import SpecialtiesSection from './SpecialtiesSection';
import './UniversityDetails.css';

const UniversityDetails = ({ user }) => {
  const { id } = useParams();
  const [university, setUniversity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
            {university.additive_criterion && (
              <p style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold', color: '#2e7d32' }}>
                <strong>📊 Аддитивный критерий:</strong> {(university.additive_criterion).toFixed(4)}
              </p>
            )}
            <p><strong>Заявлений всего:</strong> {university.total_applications ?? 0}</p>
            <p><strong>Частота подачи заявлений (дней):</strong> {university.application_frequency !== undefined && university.application_frequency !== null ? university.application_frequency.toFixed(2) : '—'}</p>
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