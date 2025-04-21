import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './QuestionSection.css';

const QuestionSection = () => {
  const navigate = useNavigate();

  return (
    <div className="question-section">
      <h3>Какой же вуз мне выбрать?</h3>
      <Button 
        variant="primary" 
        size="lg"
        onClick={() => navigate('/universities')}
      >
        Подобрать вуз
      </Button>
    </div>
  );
};

export default QuestionSection;