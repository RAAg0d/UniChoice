import React, { useEffect, useState } from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(response.status === 403 
          ? 'Доступ запрещен. Проверьте права администратора' 
          : 'Ошибка при загрузке пользователей');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Ошибка:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Блокировка пользователя
  const handleBanUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при блокировке пользователя');
      }

      // Обновляем статус пользователя в состоянии
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.users_id === userId ? { ...user, is_banned: true } : user
        )
      );
    } catch (error) {
      console.error('Ошибка при блокировке пользователя:', error);
      alert('Не удалось заблокировать пользователя. Пожалуйста, попробуйте позже.');
    }
  };

  // Разблокировка пользователя
  const handleUnbanUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/users/${userId}/unban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при разблокировке пользователя');
      }

      // Обновляем статус пользователя в состоянии
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.users_id === userId ? { ...user, is_banned: false } : user
        )
      );
    } catch (error) {
      console.error('Ошибка при разблокировке пользователя:', error);
      alert('Не удалось разблокировать пользователя. Пожалуйста, попробуйте позже.');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-panel">
      <h1>Панель администратора</h1>
      <h2>Список пользователей</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>ФИО</th>
            <th>Email</th>
            <th>Тип</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.users_id}>
              <td>{user.users_id}</td>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.user_type}</td>
              <td>
                <Badge bg={user.is_banned ? 'danger' : 'success'}>
                  {user.is_banned ? 'Заблокирован' : 'Активен'}
                </Badge>
              </td>
              <td>
                {user.is_banned ? (
                  <Button variant="success" size="sm" onClick={() => handleUnbanUser(user.users_id)}>
                    Разблокировать
                  </Button>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => handleBanUser(user.users_id)}>
                    Заблокировать
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminPanel;