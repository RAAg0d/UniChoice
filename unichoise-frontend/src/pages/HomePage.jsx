// Главная страница
import React from 'react';
import WelcomeSection from '../components/WelcomeSection';
import QuestionSection from '../components/QuestionSection';
import BottomSection from '../components/BottomSection';

const HomePage = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="top-content">
          <WelcomeSection />
          <QuestionSection />
        </div>
        <BottomSection />
      </div>
    </div>
  );
};

export default HomePage;
