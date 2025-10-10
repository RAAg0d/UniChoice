import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UniversityList.css';

const UniversityList = () => {
  const [universities, setUniversities] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ name: '', location: '', specialty: '', sortBy: 'popularity', sortOrder: 'desc' });
  const navigate = useNavigate();

  // Loads paginated universities list with optional filters
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
            <input type="text" name="name" placeholder="Название" onChange={handleFilterChange} />
            <input type="text" name="location" placeholder="Местоположение" onChange={handleFilterChange} />
            <input type="text" name="specialty" placeholder="Специальность" onChange={handleFilterChange} />
            <select name="sortBy" onChange={handleFilterChange} defaultValue="popularity">
              <option value="popularity">Популярность</option>
              <option value="rating">Рейтинг</option>
              <option value="name">Название</option>
              <option value="location">Местоположение</option>
            </select>
            <select name="sortOrder" onChange={handleFilterChange} defaultValue="desc">
              <option value="desc">По убыванию</option>
              <option value="asc">По возрастанию</option>
            </select>
          </div>

          {isLoading && <div className="loading-spinner">Загрузка...</div>}

          {error && <div className="error-message">{error}</div>}

          {/* Render list of universities with aggregate stats */}
          <div className="universities-list">
            {universities.map((university) => (
              <div key={university.universities_id} className="university-item">
                <h2>{university.name}</h2>
                <div className="university-rating">
                  Оценка вуза: {university.average_rating || 'Нет оценок'}
                </div>
                <div className="university-stats">
                  <div>Заявлений всего: {university.total_applications ?? 0}</div>
                  <div>За 30 дней: {university.applications_last_30_days ?? 0}</div>
                  <div>
                    Последнее заявление: {
                      university.days_since_last_application === null || university.days_since_last_application === undefined
                        ? 'нет данных'
                        : `${university.days_since_last_application} дн. назад`
                    }
                  </div>
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