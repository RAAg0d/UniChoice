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
          
          <SpecialtiesSection universityId={id} user={user} />
          
          <ReviewsSection user={user} />
        </div>
      </div>
    </div>
  );
};

export default UniversityDetails;