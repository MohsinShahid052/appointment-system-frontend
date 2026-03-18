import React from 'react';

const FloatingWhatsApp = ({ phoneNumber, message = "Hi, I have a question about booking an appointment." }) => {
  if (!phoneNumber) return null;

  // Clean the phone number (remove spaces, dashes, parentheses, keep plus if any)
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

  const handleClick = (e) => {
    e.preventDefault();
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#25D366',
        color: 'white',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        zIndex: 9999,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
      }}
      title="Contact us on WhatsApp"
    >
      {/* Official WhatsApp SVG Icon */}
      <svg
        viewBox="0 0 32 32"
        width="34"
        height="34"
        fill="currentColor"
        style={{ display: 'block' }}
      >
        <path d="M16.035,2.029 C8.291,2.029 2,8.32 2,16.064 C2,18.536 2.646,20.941 3.861,23.082 L2.062,29.689 L8.835,27.912 C10.923,29.014 13.258,29.596 16.035,29.596 C23.779,29.596 30.07,23.305 30.07,15.561 C30.07,7.817 23.779,2.029 16.035,2.029 M24.238,21.579 C23.957,22.368 22.84,23.064 22.029,23.23 C21.434,23.351 20.657,23.447 16.633,20.219 C11.536,16.126 10.655,14.653 10.598,14.577 C10.54,14.502 9.619,13.277 9.619,12.01 C9.619,10.744 10.264,10.125 10.518,9.865 C10.726,9.652 11.139,9.544 11.534,9.544 C11.661,9.544 11.776,9.55 11.878,9.554 C12.215,9.569 12.385,9.59 12.607,10.125 C12.887,10.803 13.571,12.473 13.655,12.646 C13.74,12.82 13.824,13.068 13.712,13.29 C13.6,13.513 13.486,13.621 13.318,13.818 C13.151,14.015 12.969,14.184 12.812,14.39 C12.642,14.613 12.457,14.839 12.706,15.267 C12.955,15.695 13.568,16.696 14.398,17.433 C15.466,18.384 16.417,18.683 16.866,18.868 C17.202,19.006 17.607,18.975 17.844,18.72 C18.143,18.401 18.52,17.849 18.913,17.296 C19.193,16.901 19.54,16.852 19.932,17.001 C20.324,17.15 22.394,18.17 22.814,18.38 C23.234,18.591 23.514,18.697 23.626,18.892 C23.738,19.088 23.738,20.038 23.456,20.829 L24.238,21.579 Z"></path>
      </svg>
    </div>
  );
};

export default FloatingWhatsApp;