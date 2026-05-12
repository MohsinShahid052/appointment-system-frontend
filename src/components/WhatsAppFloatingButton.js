import React from 'react';

const WHATSAPP_NUMBER = '31629544449';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const WhatsAppFloatingButton = () => {
  return (
    <a
      href={WHATSAPP_URL}
      className="whatsapp-float-btn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <svg
        className="whatsapp-float-icon"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M19.11 17.42c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.31.2-.58.07-.27-.14-1.13-.42-2.15-1.34-.79-.71-1.33-1.59-1.49-1.85-.16-.27-.02-.42.12-.56.12-.12.27-.31.41-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.14-.61-1.47-.84-2.01-.22-.53-.44-.45-.61-.46h-.52c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.28 0 1.34.97 2.64 1.11 2.82.14.18 1.91 2.91 4.63 4.08.65.28 1.15.45 1.54.57.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.83-1.29.23-.63.23-1.17.16-1.29-.06-.12-.25-.2-.52-.34z"
        />
        <path
          fill="currentColor"
          d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.54 1.74 6.52L3 29l6.63-1.72A12.95 12.95 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.69c-2.04 0-4.04-.55-5.78-1.58l-.41-.24-3.93 1.02 1.05-3.84-.27-.39A10.62 10.62 0 0 1 5.31 16C5.31 10.11 10.11 5.31 16 5.31S26.69 10.11 26.69 16 21.89 26.69 16 26.69z"
        />
      </svg>
    </a>
  );
};

export default WhatsAppFloatingButton;
