import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UniversityList.css';

const UniversityList = () => {
  const [universities, setUniversities] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ rating: '', location: '' });
  const navigate = useNavigate();

  const loadUniversities = (page, filters) => {
    setIsLoading(true);
    const queryParams = new URLSearchParams({
      page,
      ...filters,
    }).toString();

    fetch(`http://localhost:5000/universities?${queryParams}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка при загрузке данных');
        }
        return response.json();
      })
      .then((data) => {
        setUniversities((prev) => (page === 1 ? data.universities : [...prev, ...data.universities]));
        setTotalPages(data.totalPages);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке вузов:', error);
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadUniversities(page, filters);
  }, [page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  return (
    <div className="page-container">
      <div className="university-list-container">
        <div className="university-list-content">
          <h1>Список вузов</h1>
          <button onClick={() => navigate('/')}>На главную</button>

          <div className="filters">
            <select name="rating" onChange={handleFilterChange}>
              <option value="">Рейтинг</option>
              <option value="5">5 звезд</option>
              <option value="4">4 звезды</option>
              <option value="3">3 звезды</option>
            </select>
            <input
              type="text"
              name="location"
              placeholder="Местоположение"
              onChange={handleFilterChange}
            />
          </div>

          {isLoading && <div className="loading-spinner">Загрузка...</div>}

          {error && <div className="error-message">{error}</div>}

          <div className="universities-list">
            {universities.map((university) => (
              <div key={university.universities_id} className="university-item">
                <h2>{university.name}</h2>
                <div className="university-rating">
                  Оценка вуза: {university.average_rating || 'Нет оценок'}
                </div>
                <button onClick={() => navigate(`/universities/${university.universities_id}`)}>
                  Подробнее
                </button>
              </div>
            ))}
          </div>

          {page < totalPages && (
            <button onClick={() => setPage(page + 1)}>Загрузить еще</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityList;