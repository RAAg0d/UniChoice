import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import './SpecialtiesSection.css';
import AdmissionForm from './AdmissionForm';

const SpecialtiesSection = ({ universityId, user }) => {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await fetch(`http://localhost:5000/universities/${universityId}/specialties`);
        if (!response.ok) {
          throw new Error('Ошибка при загрузке специальностей');
        }
        const data = await response.json();
        setSpecialties(data);
      } catch (error) {
        console.error('Ошибка:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, [universityId]);

  if (loading) return <div>Загрузка специальностей...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="specialties-section">
      <h3>Специальности</h3>
      <div className="specialties-grid">
        {specialties.map((specialty) => (
          <div key={specialty.specialty_id} className="specialty-card">
            <h4>{specialty.specialty_name}</h4>
            <p><strong>Код:</strong> {specialty.specialty_code}</p>
            <p>{specialty.description}</p>
            <div className="specialty-details">
              <p><strong>Длительность:</strong> {specialty.duration}</p>
              <p><strong>Форма обучения:</strong> {specialty.form_of_education}</p>
              <p><strong>Бюджетные места:</strong> {specialty.budget_places}</p>
              <p><strong>Стоимость в год:</strong> {specialty.cost_per_year} ₽</p>
              <p><strong>Проходной балл:</strong> {specialty.passing_score}</p>
            </div>
            {user && user.user_type !== 'university_representative' && (
              <Button 
                variant="primary"
                onClick={() => {
                  setSelectedSpecialty(specialty);
                  setShowAdmissionForm(true);
                }}
              >
                Подать заявление
              </Button>
            )}
          </div>
        ))}
      </div>

      <AdmissionForm 
        show={showAdmissionForm}
        handleClose={() => setShowAdmissionForm(false)}
        specialtyId={selectedSpecialty?.specialty_id}
        universityId={universityId}
        user={user}
      />
    </div>
  );
};

export default SpecialtiesSection;
