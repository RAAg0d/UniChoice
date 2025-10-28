import React, { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import './PopularUniversities.css';

const PopularUniversities = () => {
  const [showPopular, setShowPopular] = useState(false);
  const [popularUnis, setPopularUnis] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPopularUniversities = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/universities?sortBy=popularity&limit=6');
        if (response.ok) {
          const data = await response.json();
          setPopularUnis(data.universities || []);
        }
      } catch (error) {
        console.error('Ошибка при загрузке популярных вузов:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPopularUniversities();
  }, []);

  return (
    <div className="popular-container">
      <Card className="popular-universities">
        <Card.Header onClick={() => setShowPopular(!showPopular)} className="popular-header">
          Топ самых популярных вузов {showPopular ? '▲' : '▼'}
        </Card.Header>
        <div className={`popular-list ${showPopular ? 'expanded' : ''}`}>
          <Card.Body>
            {loading ? (
              <div className="text-center">Загрузка...</div>
            ) : (
              <Row className="justify-content-center">
                {popularUnis.map((uni, index) => (
                  <Col key={uni.universities_id || index} md={2} className="popular-item">
                    {uni.name}
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </div>
      </Card>
    </div>
  );
};

export default PopularUniversities;