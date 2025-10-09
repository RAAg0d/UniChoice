/**
 * UniChoice Frontend - Главное приложение
 * 
 * React приложение для системы выбора университетов.
 * Включает аутентификацию, управление университетами, заявлениями и отзывами.
 * 
 * Основные компоненты:
 * - Header: навигация и аутентификация
 * - AuthModal: модальное окно входа/регистрации
 * - UniversityList: список университетов с фильтрами
 * - UniversityDetails: детальная информация об университете
 * - AdminPanel: панель администратора
 * - MyApplications: мои заявления
 * 
 * Использует React Router для навигации и Bootstrap для стилизации.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap стили
import './App.css'; // Кастомные стили приложения

// Импорт основных компонентов
import Header from './components/Header';                    // Шапка сайта с навигацией
import AuthModal from './components/AuthModal';             // Модальное окно аутентификации
import BottomSection from './components/BottomSection';     // Нижняя секция главной страницы
import QuestionSection from './components/QuestionSection'; // Секция с вопросами
import Footer from './components/Footer';                   // Подвал сайта
import AdminPanel from './components/AdminPanel';           // Панель администратора
import UniversityApplications from './components/UniversityApplications'; // Заявления университетов
import AddUniversityForm from './components/AddUniversityForm';           // Форма добавления вуза
import RepresentativeApplications from './components/RepresentativeApplications'; // Заявления представителей
import AdmissionApplications from './components/AdmissionApplications';   // Заявления на поступление
import MyApplications from './components/MyApplications';   // Мои заявления
import WelcomeSection from './components/WelcomeSection';   // Приветственная секция

// Ленивая загрузка тяжелых компонентов для оптимизации
const UniversityList = React.lazy(() => import('./components/UniversityList'));
const UniversityDetails = React.lazy(() => import('./components/UniversityDetails'));

/**
 * Компонент загрузки для ленивых компонентов
 * Показывает спиннер во время загрузки компонентов
 */
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Загрузка...</span>
    </div>
  </div>
);

/**
 * Основной контент приложения
 * Управляет состоянием пользователя, модальными окнами и навигацией
 */
const AppContent = () => {
  const navigate = useNavigate();
  
  // Состояние пользователя и аутентификации
  const [user, setUser] = useState(null);                    // Текущий пользователь
  const [showAuthModal, setShowAuthModal] = useState(false); // Показать модальное окно входа
  const [isRegister, setIsRegister] = useState(false);       // Режим регистрации/входа
  const [showAddUniversityForm, setShowAddUniversityForm] = useState(false); // Форма добавления вуза
  
  // Данные формы аутентификации
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const resetAppState = () => {
    setShowAuthModal(false);
    setIsRegister(false);
    setShowAddUniversityForm(false);
    setFormData({
      fullName: '',
      email: '',
      password: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleAuth = async (isRepresentative = false) => {
    const url = isRegister ? 'http://localhost:5000/register' : 'http://localhost:5000/login';
    
    try {
      const requestData = {
        email: formData.email,
        password: formData.password
      };

      if (isRegister) {
        requestData.full_name = formData.fullName;
        requestData.is_representative = isRepresentative;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка авторизации');
      }

      const responseData = await response.json();
      
      localStorage.setItem('token', responseData.token);
      
      const safeUserData = {
        users_id: responseData.users_id,
        full_name: responseData.full_name,
        email: responseData.email,
        user_type: responseData.user_type
      };
      
      localStorage.setItem('user', JSON.stringify(safeUserData));
      setUser(safeUserData);
      
      console.log('User data saved:', safeUserData);
      console.log('Token saved:', responseData.token);
      
      resetAppState();
      
      window.location.reload();
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.message || 'Произошла ошибка при авторизации');
    }
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    setIsRegister(false);
  };
  
  return (
    <div className="app-container">
      <AuthModal
        showAuthModal={showAuthModal}
        isRegister={isRegister}
        setIsRegister={setIsRegister}
        handleAuth={handleAuth}
        handleInputChange={handleInputChange}
        handleClose={handleCloseAuthModal}
      />

      <Header 
        user={user} 
        setShowAuthModal={setShowAuthModal}
        setShowAddUniversityForm={setShowAddUniversityForm}
        handleLogout={handleLogout}
      />

      {user?.user_type === 'university_representative' && (
        <AddUniversityForm 
          show={showAddUniversityForm}
          handleClose={() => setShowAddUniversityForm(false)}
        />
      )}

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={
            <div className="home-container">
              <div className="home-content">
                <div className="top-content">
                  <WelcomeSection />
                  <QuestionSection />
                </div>
                <BottomSection />
              </div>
            </div>
          } />
          <Route path="/universities" element={<UniversityList />} />
          <Route path="/universities/:id" element={<UniversityDetails user={user} />} />
          <Route path="/admin" element={
            <div className="page-container">
              <AdminPanel user={user} />
            </div>
          } />
          <Route path="/admin/applications" element={
            <div className="page-container">
              <UniversityApplications user={user} />
            </div>
          } />
          <Route path="/my-applications" element={
            <div className="page-container">
              <RepresentativeApplications user={user} />
            </div>
          } />
          <Route path="/admission-applications" element={
            <div className="page-container">
              <AdmissionApplications user={user} />
            </div>
          } />
          <Route path="/my-admission-applications" element={
            <div className="page-container">
              <MyApplications user={user} />
            </div>
          } />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;