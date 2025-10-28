import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import './AdmissionForm.css';

const AdmissionForm = ({ show, handleClose, specialtyId, universityId, user }) => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    totalScore: '',
    wantsBudget: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Валидация
    if (!formData.phoneNumber || !formData.totalScore) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (formData.totalScore < 0 || formData.totalScore > 310) {
      setError('Сумма баллов ЕГЭ должна быть от 0 до 310');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/admission-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          specialtyId,
          phoneNumber: formData.phoneNumber,
          totalScore: parseInt(formData.totalScore),
          wantsBudget: formData.wantsBudget
        })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Ошибка ответа:', data);
        throw new Error(data.message || 'Произошла ошибка при подаче заявления');
      }
      
      const data = await response.json();

      setSuccess(true);
      setTimeout(() => {
        handleClose();
        setFormData({
          phoneNumber: '',
          totalScore: '',
          wantsBudget: false
        });
      }, 2000);
    } catch (error) {
      setError(error.message || 'Произошла ошибка при подаче заявления');
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
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Подача заявления</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">Заявление успешно подано!</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Номер телефона</Form.Label>
            <Form.Control
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+7 (XXX) XXX-XX-XX"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Сумма баллов ЕГЭ</Form.Label>
            <Form.Control
              type="number"
              name="totalScore"
              value={formData.totalScore}
              onChange={handleChange}
              min="0"
              max="310"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="wantsBudget"
              label="Хочу поступить на бюджет"
              checked={formData.wantsBudget}
              onChange={handleChange}
            />
          </Form.Group>

          <Button variant="primary" type="submit">
            Подать заявление
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AdmissionForm;
