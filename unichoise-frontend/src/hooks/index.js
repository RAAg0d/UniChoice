// Кастомные хуки для React
import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils';

/**
 * Хук для работы с API запросами
 * @param {string} url - URL для запроса
 * @param {Object} options - опции запроса
 * @returns {Object} состояние запроса
 */
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRequest(url, options);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Хук для работы с университетами
 * @param {Object} filters - фильтры для поиска
 * @returns {Object} состояние университетов
 */
export const useUniversities = (filters = {}) => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const loadUniversities = useCallback(async (page = 1, newFilters = filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...newFilters,
        includeAdditive: 'true'
      }).toString();

      const result = await apiRequest(`/universities?${queryParams}`);
      
      if (page === 1) {
        setUniversities(result.universities);
      } else {
        setUniversities(prev => [...prev, ...result.universities]);
      }
      
      setTotalPages(result.totalPages);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUniversities(1);
  }, [loadUniversities]);

  const loadMore = useCallback(() => {
    if (currentPage < totalPages && !loading) {
      loadUniversities(currentPage + 1);
    }
  }, [currentPage, totalPages, loading, loadUniversities]);

  return {
    universities,
    loading,
    error,
    totalPages,
    currentPage,
    loadMore,
    refetch: () => loadUniversities(1)
  };
};

/**
 * Хук для работы с аутентификацией
 * @returns {Object} состояние аутентификации
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userData);
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const result = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const result = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };
};

/**
 * Хук для работы с заявлениями на поступление
 * @returns {Object} состояние заявлений
 */
export const useAdmissionApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRequest('/admission-applications/my');
      setApplications(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitApplication = useCallback(async (applicationData) => {
    try {
      const result = await apiRequest('/admission-applications', {
        method: 'POST',
        body: JSON.stringify(applicationData)
      });
      
      // Обновляем список заявлений
      await loadApplications();
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [loadApplications]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  return {
    applications,
    loading,
    error,
    submitApplication,
    refetch: loadApplications
  };
};

/**
 * Хук для работы с отзывами
 * @param {number} universityId - ID университета
 * @returns {Object} состояние отзывов
 */
export const useReviews = (universityId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReviews = useCallback(async () => {
    if (!universityId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRequest(`/universities/${universityId}/reviews`);
      setReviews(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  const addReview = useCallback(async (reviewData) => {
    try {
      const result = await apiRequest(`/universities/${universityId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
      
      // Обновляем список отзывов
      await loadReviews();
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [universityId, loadReviews]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return {
    reviews,
    loading,
    error,
    addReview,
    refetch: loadReviews
  };
};

/**
 * Хук для работы с фильтрами
 * @param {Object} initialFilters - начальные фильтры
 * @returns {Object} состояние фильтров
 */
export const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    setFilters
  };
};
