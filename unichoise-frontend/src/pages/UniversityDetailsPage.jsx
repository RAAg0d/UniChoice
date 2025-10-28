// Страница деталей университета
import React from 'react';
import UniversityDetails from '../components/UniversityDetails';

const UniversityDetailsPage = ({ user }) => {
  return (
    <div className="university-details-page">
      <UniversityDetails user={user} />
    </div>
  );
};

export default UniversityDetailsPage;
