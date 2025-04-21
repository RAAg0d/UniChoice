import React, { useEffect, useState } from 'react';
import { Table, Badge, Alert, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import './MyApplications.css';

const MyApplications = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('http://localhost:5000/admission-applications/my', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке заявлений');
        }

        const data = await response.json();
        setApplications(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplications();
    }
  }, [user]);

  if (loading) return <div className="applications-container">Загрузка...</div>;

  if (error) {
    return (
      <div className="applications-container">
        <Alert variant="danger">
          <Alert.Heading>Ошибка</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <div className="applications-content">
        <h2>Мои заявления</h2>
        
        {applications.length === 0 ? (
          <Alert variant="info">
            У вас пока нет поданных заявлений
          </Alert>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Университет</th>
                <th>Специальность</th>
                <th>Сумма баллов</th>
                <th>Форма обучения</th>
                <th>Статус</th>
                <th>Дата подачи</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.application_id}>
                  <td>{app.university_name}</td>
                  <td>{app.specialty_name} ({app.specialty_code})</td>
                  <td>{app.total_score}</td>
                  <td>{app.wants_budget ? 'Бюджет' : 'Платное'}</td>
                  <td>
                    <Badge bg={
                      app.status === 'approved' ? 'success' : 
                      app.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {app.status === 'approved' ? 'Одобрено' : 
                       app.status === 'rejected' ? 'Отклонено' : 'На рассмотрении'}
                    </Badge>
                  </td>
                  <td>{new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
