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
      includeAdditive: true  // Всегда включаем аддитивный критерий
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
            <div className="filter-group">
              <label className="filter-label">🔍 Поиск по названию</label>
              <input 
                type="text" 
                name="name" 
                placeholder="Введите название вуза..." 
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">📍 Местоположение</label>
              <input 
                type="text" 
                name="location" 
                placeholder="Город или регион..." 
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">🎓 Специальность</label>
              <input 
                type="text" 
                name="specialty" 
                placeholder="Название специальности..." 
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">📊 Сортировка</label>
              <select name="sortBy" onChange={handleFilterChange} defaultValue="popularity" className="filter-select">
                <option value="popularity">🔥 Популярность</option>
                <option value="rating">⭐ Рейтинг</option>
                <option value="additive">📈 Аддитивный критерий</option>
                <option value="name">🔤 Название</option>
                <option value="location">📍 Местоположение</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">🔄 Порядок</label>
              <select name="sortOrder" onChange={handleFilterChange} defaultValue="desc" className="filter-select">
                <option value="desc">⬇️ По убыванию</option>
                <option value="asc">⬆️ По возрастанию</option>
              </select>
            </div>
            
            <div className="filter-actions">
              <button 
                onClick={() => {
                  setFilters({ name: '', location: '', specialty: '', sortBy: 'popularity', sortOrder: 'desc' });
                  setPage(1);
                }}
                className="clear-filters-btn"
              >
                🗑️ Очистить фильтры
              </button>
            </div>
          </div>

          {isLoading && <div className="loading-spinner">Загрузка...</div>}

          {error && <div className="error-message">{error}</div>}

          {/* Render list of universities with aggregate stats */}
          <div className="universities-list">
            {universities.map((university) => (
              <div key={university.universities_id} className="university-item">
                <div className="university-header">
                  <h2>{university.name}</h2>
                </div>
                
                <div className="university-metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">⭐ Оценка</div>
                    <div className="metric-value">{university.average_rating ? `${university.average_rating} / 5` : 'Нет оценок'}</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-label">📊 Аддитивный критерий</div>
                    <div className="metric-value">{university.additive_criterion ? (university.additive_criterion).toFixed(4) : '—'}</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-label">📝 Заявлений всего</div>
                    <div className="metric-value">{university.total_applications ?? 0}</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-label">⏱️ Частота заявлений (дней)</div>
                    <div className="metric-value">{university.application_frequency !== undefined && university.application_frequency !== null ? university.application_frequency.toFixed(2) : '—'}</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-label">🕒 Последнее заявление</div>
                    <div className="metric-value">
                      {university.days_since_last_application === null || university.days_since_last_application === undefined
                        ? 'нет данных'
                        : `${university.days_since_last_application} дн. назад`}
                    </div>
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