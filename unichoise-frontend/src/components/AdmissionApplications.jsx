import React, { useEffect, useState } from 'react';
import { Table, Badge, Button, Alert } from 'react-bootstrap';
import './AdmissionApplications.css';

const AdmissionApplications = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        console.log('Начинаем загрузку заявлений...');
        console.log('Текущий пользователь:', user);

        const token = localStorage.getItem('token');
        console.log('Токен получен:', !!token);

        const response = await fetch('http://localhost:5000/admission-applications/university', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Статус ответа:', response.status);
        const data = await response.json();
        console.log('Полученные данные:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Ошибка при загрузке заявлений');
        }

        setApplications(data);
      } catch (error) {
        console.error('Подробная ошибка:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_type === 'university_representative') {
      fetchApplications();
    }
  }, [user]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/admission-applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении статуса');
      }

      setApplications(applications.map(app => 
        app.application_id === applicationId 
          ? { ...app, status: newStatus }
          : app
      ));

      alert('Статус заявления успешно обновлен!');
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось обновить статус заявления');
    }
  };

  if (loading) {
    return <div className="applications-container">Загрузка...</div>;
  }

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

  if (!user || user.user_type !== 'university_representative') {
    return (
      <div className="applications-container">
        <Alert variant="warning">
          <Alert.Heading>Доступ запрещен</Alert.Heading>
          <p>Эта страница доступна только представителям вузов.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <div className="applications-content">
        <h2>Заявления абитуриентов</h2>
        
        {applications.length === 0 ? (
          <Alert variant="info">
            Пока нет поданных заявлений
          </Alert>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ФИО абитуриента</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Университет</th>
                <th>Специальность</th>
                <th>Сумма баллов</th>
                <th>Форма обучения</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.application_id}>
                  <td>{app.applicant_name}</td>
                  <td>{app.applicant_email}</td>
                  <td>{app.phone_number}</td>
                  <td>{app.university_name}</td>
                  <td>{app.specialty_name}</td>
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
                  <td>
                    {app.status === 'на рассмотрении' && (
                      <div className="d-flex gap-2">
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => handleStatusChange(app.application_id, 'approved')}
                        >
                          Одобрить
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleStatusChange(app.application_id, 'rejected')}
                        >
                          Отклонить
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdmissionApplications;
