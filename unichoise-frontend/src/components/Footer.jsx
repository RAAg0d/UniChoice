import React from 'react';
import { FaVk, FaTelegram, FaWhatsapp } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-contact">
          <span> unichoice@gmail.com | +7 (999) 999-99-99</span>
          <a href="https://" target="_blank" rel="noopener noreferrer">
            <FaVk className="social-icon" />
          </a>
          <a href="https://" target="_blank" rel="noopener noreferrer">
            <FaTelegram className="social-icon" />
          </a>
          <a href="https://" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp className="social-icon" />
          </a>
        </div>
        <div className="footer-copyright">
          © 2025 UniChoice. Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export default Footer;