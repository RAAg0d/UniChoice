import React, { useEffect, useState } from 'react';
import { Table, Badge, Button, Modal } from 'react-bootstrap';
import './UniversityApplications.css';
import './ApplicationsCommon.css';

const RepresentativeApplications = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('http://localhost:5000/university-applications', {
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
        console.error('Ошибка:', error);
        alert('Не удалось загрузить заявления');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplications();
    }
  }, [user]);

  if (loading) return <div className="applications-container">Загрузка...</div>;

  return (
    <div className="applications-container">
      <div className="applications-content">
        <h2>Мои заявки на добавление вузов</h2>
        
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Название вуза</th>
              <th>Описание</th>
              <th>Город</th>
              <th>Статус</th>
              <th>Дата подачи</th>
              <th>Комментарий администратора</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.application_id}>
                <td>{app.university_name}</td>
                <td>{app.description}</td>
                <td>{app.location}</td>
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
                <td>
                  {app.admin_comment && (
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSelectedApplication(app);
                        setShowCommentModal(true);
                      }}
                    >
                      Просмотреть комментарий
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Комментарий администратора</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedApplication && (
            <>
              <h5>Заявка на добавление: {selectedApplication.university_name}</h5>
              <p>Статус: <Badge bg={selectedApplication.status === 'rejected' ? 'danger' : 'success'}>
                {selectedApplication.status === 'rejected' ? 'Отклонено' : 'Одобрено'}
              </Badge></p>
              <div className="comment-box">
                <p><strong>Комментарий:</strong></p>
                <p>{selectedApplication.admin_comment}</p>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RepresentativeApplications;
