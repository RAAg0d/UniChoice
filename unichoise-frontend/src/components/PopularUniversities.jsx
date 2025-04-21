import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import './PopularUniversities.css';

const PopularUniversities = ({ showPopular, setShowPopular, popularUnis }) => {
  return (
    <div className="popular-container">
      <Card className="popular-universities">
        <Card.Header onClick={() => setShowPopular(!showPopular)} className="popular-header">
          Топ самых популярных вузов {showPopular ? '▲' : '▼'}
        </Card.Header>
        <div className={`popular-list ${showPopular ? 'expanded' : ''}`}>
          <Card.Body>
            <Row className="justify-content-center">
              {popularUnis.map((uni, index) => (
                <Col key={index} md={2} className="popular-item">{uni}</Col>
              ))}
            </Row>
          </Card.Body>
        </div>
      </Card>
    </div>
  );
};

export default PopularUniversities;