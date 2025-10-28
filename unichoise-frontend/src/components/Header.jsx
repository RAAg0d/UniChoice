// Компонент Header
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ user, setShowAuthModal, setShowAddUniversityForm, handleLogout }) => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="header-logo">UniChoice</h1>
        </div>
        
        <div className="header-center">
          <nav className="header-nav">
            <Link to="/" className="nav-link">Главная</Link>
            <Link to="/universities" className="nav-link">Вузы</Link>
          </nav>
        </div>
        
        <div className="header-right">
          {user ? (
            <div className="user-menu">
              <span className="user-name">Привет, {user.full_name}!</span>
              
              {user.user_type === 'admin' && (
                <Link to="/admin" className="nav-link">Админ панель</Link>
              )}
              
              {user.user_type === 'university_representative' && (
                <>
                  <button 
                    onClick={() => setShowAddUniversityForm(true)}
                    className="nav-button"
                  >
                    Добавить вуз
                  </button>
                  <Link to="/admission-applications" className="nav-link">
                    Заявления
                  </Link>
                </>
              )}
              
              {(user.user_type === 'student' || user.user_type === 'user') && (
                <Link to="/my-admission-applications" className="nav-link">
                  Мои заявления
                </Link>
              )}
              
              <button onClick={handleLogout} className="logout-button">
                Выйти
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="login-button"
              >
                Войти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
