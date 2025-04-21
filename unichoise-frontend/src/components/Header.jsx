import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ user, setShowAuthModal, setShowAddUniversityForm, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };
  
  const handleAdminButtonClick = () => {
    if (location.pathname === '/admin') {
      navigate('/');
    } else {
      navigate('/admin');
    }
  };

  const handleApplicationsClick = () => {
    if (location.pathname === '/admin/applications') {
      navigate('/');
    } else {
      navigate('/admin/applications');
    }
  };

  const handleMyApplicationsClick = () => {
    if (location.pathname === '/my-applications') {
      navigate('/');
    } else {
      navigate('/my-applications');
    }
  };

  const handleAdmissionApplicationsClick = () => {
    if (location.pathname === '/admission-applications') {
      navigate('/');
    } else {
      navigate('/admission-applications');
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
  };

  return (
    <header className="header">
      <h2 onClick={handleLogoClick} style={{ cursor: 'pointer' }}>UniChoice</h2>
      <div className="user-info">
        <span>{user ? user.full_name : 'Гость'}</span>
        
        {!user && (
          <img
            src="/user-icon.png"
            alt="User"
            className="user-icon"
            onClick={() => setShowAuthModal(true)}
          />
        )}

        {!user && (
          <button onClick={() => setShowAuthModal(true)} className="login-btn">
            Войти
          </button>
        )}
        
        {user && (
          <button onClick={handleLogoutClick} className="logout-btn">
            Выйти
          </button>
        )}
        
        {user?.user_type === 'admin' && (
          <>
            <button onClick={handleAdminButtonClick}>
              {location.pathname === '/admin' ? 'Главная' : 'Пользователи'}
            </button>
            <button onClick={handleApplicationsClick}>
              {location.pathname === '/admin/applications' ? 'Главная' : 'Заявки на добавление'}
            </button>
          </>
        )}
        
        {user?.user_type === 'university_representative' && (
          <>
            <button onClick={() => setShowAddUniversityForm(true)}>
              Добавить свой вуз
            </button>
            <button onClick={handleMyApplicationsClick}>
              {location.pathname === '/my-applications' ? 'Главная' : 'Мои заявления'}
            </button>
            <button onClick={handleAdmissionApplicationsClick}>
              {location.pathname === '/admission-applications' ? 'Главная' : 'Заявления абитуриентов'}
            </button>
          </>
        )}
        
        {user?.user_type === 'user' && (
          <button onClick={() => {
            if (location.pathname === '/my-admission-applications') {
              navigate('/');
            } else {
              navigate('/my-admission-applications');
            }
          }}>
            {location.pathname === '/my-admission-applications' ? 'Главная' : 'Мои заявления на поступление'}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;