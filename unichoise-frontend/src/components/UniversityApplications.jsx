import React, { useEffect, useState } from 'react';
import { Table, Button, Badge, Form } from 'react-bootstrap';
import './UniversityApplications.css';
import '../components/ApplicationsCommonTable.css';
import '../components/FormsCommon.css';
import './ApplicationsCommon.css';

const UniversityApplications = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('http://localhost:5000/university-applications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Ошибка при загрузке заявок');
        }

        const data = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить заявки');
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_type === 'admin') {
      fetchApplications();
    }
  }, [user]);

  const handleProcessApplication = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:5000/university-applications/${id}/process`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          admin_comment: comments[id] || ''
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка при обработке заявки');
      }

      const updatedApplications = applications.map(app => 
        app.application_id === id ? { ...app, status, admin_comment: comments[id] || '' } : app
      );
      setApplications(updatedApplications);
      
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[id];
        return newComments;
      });

      alert(`Заявка ${status === 'approved' ? 'одобрена' : 'отклонена'}!`);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось обработать заявку');
    }
  };

  if (loading) return <div className="applications-container">Загрузка...</div>;

  return (
    <div className="applications-container">
      <div className="applications-content">
        <h2>Заявки на добавление вузов</h2>
        
        {applications.length === 0 ? (
          <div>Нет активных заявок</div>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Название вуза</th>
                <th>Описание</th>
                <th>Местоположение</th>
                <th>Представитель</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.application_id}>
                  <td>{app.university_name}</td>
                  <td>{app.description}</td>
                  <td>{app.location}</td>
                  <td>{app.representative_name}</td>
                  <td>
                    <Badge bg={
                      app.status === 'approved' ? 'success' :
                      app.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {app.status === 'approved' ? 'Одобрено' :
                       app.status === 'rejected' ? 'Отклонено' : 'На рассмотрении'}
                    </Badge>
                    {app.admin_comment && (
                      <div className="admin-comment">
                        Комментарий: {app.admin_comment}
                      </div>
                    )}
                  </td>
                  <td>
                    {app.status === 'pending' && (
                      <>
                        <Form.Group className="mb-2">
                          <Form.Control
                            type="text"
                            placeholder="Комментарий"
                            value={comments[app.application_id] || ''}
                            onChange={(e) => setComments(prev => ({
                              ...prev,
                              [app.application_id]: e.target.value
                            }))}
                          />
                        </Form.Group>
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleProcessApplication(app.application_id, 'approved')}
                          >
                            Одобрить
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleProcessApplication(app.application_id, 'rejected')}
                          >
                            Отклонить
                          </Button>
                        </div>
                      </>
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

export default UniversityApplications;