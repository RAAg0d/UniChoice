// Константы для frontend
export const API_BASE_URL = 'http://localhost:5000';

export const ROUTES = {
  HOME: '/',
  UNIVERSITIES: '/universities',
  UNIVERSITY_DETAILS: '/universities/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
  MY_APPLICATIONS: '/my-applications',
  ADMISSION_APPLICATIONS: '/admission-applications'
};

export const USER_ROLES = {
  STUDENT: 'student',
  UNIVERSITY_REPRESENTATIVE: 'university_representative',
  ADMIN: 'admin'
};

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const SORT_OPTIONS = {
  POPULARITY: 'popularity',
  RATING: 'rating',
  ADDITIVE: 'additive',
  NAME: 'name',
  LOCATION: 'location'
};

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc'
};

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 60,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 100,
  COMMENT_MAX_LENGTH: 150,
  EXAM_SCORE_MIN: 1,
  EXAM_SCORE_MAX: 999,
  RATING_MIN: 1,
  RATING_MAX: 5
};

export const PHONE_REGEX = /^\+7\(\d{3}\)\d{7}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const COLORS = {
  PRIMARY: '#6a0dad',
  PRIMARY_HOVER: '#5a0b9d',
  SECONDARY: '#f8f9fa',
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40'
};

export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1200px'
};
