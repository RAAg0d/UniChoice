import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import './AuthModal.css';
import '../components/FormsCommon.css';

const AuthModal = ({ showAuthModal, isRegister, setIsRegister, handleClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    isRepresentative: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Отправка формы:', {
        isRegister,
        email: formData.email,
        hasPassword: !!formData.password
      });

      const url = `http://localhost:5000/${isRegister ? 'register' : 'login'}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          ...(isRegister && {
            full_name: formData.fullName,
            is_representative: formData.isRepresentative
          })
        })
      });

      const data = await response.json();
      console.log('Ответ сервера:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (!response.ok) {
        throw new Error(data.message || 'Произошла ошибка при авторизации');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        users_id: data.users_id,
        email: data.email,
        full_name: data.full_name,
        user_type: data.user_type
      }));

      handleClose();
      window.location.reload();

    } catch (error) {
      console.error('Ошибка:', error);
      setError(error.message || 'Произошла ошибка при авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Modal show={showAuthModal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{isRegister ? 'Регистрация' : 'Вход'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          {isRegister && (
            <Form.Group className="mb-3">
              <Form.Label>ФИО</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Пароль</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </Form.Group>

          {isRegister && (
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isRepresentative"
                label="Я являюсь представителем вуза"
                checked={formData.isRepresentative}
                onChange={handleChange}
                disabled={loading}
              />
            </Form.Group>
          )}

          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Загрузка...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
          </Button>
        </Form>

        <div className="mt-3">
          <Button
            variant="link"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setFormData({
                email: '',
                password: '',
                fullName: '',
                isRepresentative: false
              });
            }}
            disabled={loading}
          >
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AuthModal;