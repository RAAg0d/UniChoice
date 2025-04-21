import React, { useState } from 'react';
import { Form, Button, Modal, Card } from 'react-bootstrap';
import './AddUniversityForm.css';

const emptySpecialty = {
  specialty_name: '',
  specialty_code: '',
  description: '',
  duration: '',
  form_of_education: '',
  budget_places: '',
  cost_per_year: '',
  passing_score: ''
};

const AddUniversityForm = ({ show, handleClose }) => {
  const [formData, setFormData] = useState({
    university_name: '',
    description: '',
    location: '',
    specialties: [{ ...emptySpecialty }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpecialtyChange = (index, e) => {
    const newSpecialties = [...formData.specialties];
    newSpecialties[index] = {
      ...newSpecialties[index],
      [e.target.name]: e.target.value
    };
    setFormData({ ...formData, specialties: newSpecialties });
  };

  const addSpecialty = () => {
    setFormData({
      ...formData,
      specialties: [...formData.specialties, { ...emptySpecialty }]
    });
  };

  const removeSpecialty = (index) => {
    const newSpecialties = formData.specialties.filter((_, i) => i !== index);
    setFormData({ ...formData, specialties: newSpecialties });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userId = JSON.parse(localStorage.getItem('user')).users_id;

      const response = await fetch('http://localhost:5000/university-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          university_name: formData.university_name,
          description: formData.description,
          location: formData.location,
          representative_id: userId,
          specialties: formData.specialties
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке заявки');
      }

      handleClose();
      alert('Заявление на добавление вуза успешно отправлено на рассмотрение!');
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось отправить заявку. Пожалуйста, попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Добавить новый вуз</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Полное название вуза</Form.Label>
            <Form.Control
              type="text"
              name="university_name"
              value={formData.university_name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Описание вуза</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Город</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <h4 className="mt-4 mb-3">Специальности</h4>
          
          {formData.specialties.map((specialty, index) => (
            <Card key={index} className="mb-3 specialty-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Специальность {index + 1}</h5>
                  {formData.specialties.length > 1 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => removeSpecialty(index)}
                    >
                      Удалить
                    </Button>
                  )}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Название специальности</Form.Label>
                  <Form.Control
                    type="text"
                    name="specialty_name"
                    value={specialty.specialty_name}
                    onChange={(e) => handleSpecialtyChange(index, e)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Код специальности</Form.Label>
                  <Form.Control
                    type="text"
                    name="specialty_code"
                    value={specialty.specialty_code}
                    onChange={(e) => handleSpecialtyChange(index, e)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Описание специальности</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={specialty.description}
                    onChange={(e) => handleSpecialtyChange(index, e)}
                    required
                  />
                </Form.Group>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Длительность обучения</Form.Label>
                      <Form.Control
                        type="text"
                        name="duration"
                        value={specialty.duration}
                        onChange={(e) => handleSpecialtyChange(index, e)}
                        required
                        placeholder="Например: 4 года"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Форма обучения</Form.Label>
                      <Form.Control
                        type="text"
                        name="form_of_education"
                        value={specialty.form_of_education}
                        onChange={(e) => handleSpecialtyChange(index, e)}
                        required
                        placeholder="Например: Очная"
                      />
                    </Form.Group>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Бюджетные места</Form.Label>
                      <Form.Control
                        type="number"
                        name="budget_places"
                        value={specialty.budget_places}
                        onChange={(e) => handleSpecialtyChange(index, e)}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Стоимость в год</Form.Label>
                      <Form.Control
                        type="number"
                        name="cost_per_year"
                        value={specialty.cost_per_year}
                        onChange={(e) => handleSpecialtyChange(index, e)}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Проходной балл</Form.Label>
                      <Form.Control
                        type="number"
                        name="passing_score"
                        value={specialty.passing_score}
                        onChange={(e) => handleSpecialtyChange(index, e)}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}

          <Button 
            variant="outline-primary" 
            type="button" 
            onClick={addSpecialty}
            className="mb-3 w-100"
          >
            Добавить специальность
          </Button>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={handleClose} className="me-2">
              Отмена
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Подать заявление на добавление вуза'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddUniversityForm;